/** 한국(Asia/Seoul) 기준 날짜·구간 — 서버 TZ와 무관하게 동작 */

const SEOUL = "Asia/Seoul";

export function getSeoulYmd(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: SEOUL });
}

/** YYYY-MM-DD에 delta일(그레고리력) 더한 서울 날짜 */
export function addCalendarDaysYmd(ymd: string, delta: number): string {
  const t = new Date(`${ymd}T00:00:00+09:00`);
  t.setTime(t.getTime() + delta * 24 * 60 * 60 * 1000);
  return t.toLocaleDateString("en-CA", { timeZone: SEOUL });
}

/** 이벤트 시작이 서울 달력에서 어떤 날인지 (YYYY-MM-DD) */
export function getEventStartSeoulYmd(event: {
  start?: { dateTime?: string | null; date?: string | null };
}): string | null {
  const dateOnly = event.start?.date;
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }
  const raw = event.start?.dateTime;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA", { timeZone: SEOUL });
}

/** 서울 하루 [00:00, 다음날 00:00) — Calendar API timeMax는 exclusive */
export function seoulDayRangeIso(ymd: string): { timeMin: string; timeMax: string } {
  const next = addCalendarDaysYmd(ymd, 1);
  return {
    timeMin: `${ymd}T00:00:00+09:00`,
    timeMax: `${next}T00:00:00+09:00`,
  };
}

/** 서울 달력 요일 — 0=일 … 6=토 (JS getDay와 동일) */
export function getSeoulWeekdaySun0(ymd: string): number {
  const d = new Date(`${ymd}T12:00:00+09:00`);
  const short = d.toLocaleDateString("en-US", {
    timeZone: SEOUL,
    weekday: "short",
  });
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? 0;
}

/**
 * 월요일 시작 주간 — anchorYmd가 속한 주의 월요일(Seoul), weekOffset만큼 이동
 */
export function getSeoulMondayOfWeek(
  anchorYmd: string,
  weekOffset: number = 0
): string {
  const sun0 = getSeoulWeekdaySun0(anchorYmd);
  const daysFromMonday = sun0 === 0 ? 6 : sun0 - 1;
  return addCalendarDaysYmd(anchorYmd, -daysFromMonday + weekOffset * 7);
}

/** 해당 주 월~일 (월요일 YMD, 일요일 YMD) + Calendar API 구간 */
export function getSeoulWeekRange(
  anchorYmd: string,
  weekOffset: number = 0
): {
  mondayYmd: string;
  sundayYmd: string;
  nextMondayYmd: string;
  timeMin: string;
  timeMax: string;
} {
  const mondayYmd = getSeoulMondayOfWeek(anchorYmd, weekOffset);
  const sundayYmd = addCalendarDaysYmd(mondayYmd, 6);
  const nextMondayYmd = addCalendarDaysYmd(mondayYmd, 7);
  return {
    mondayYmd,
    sundayYmd,
    nextMondayYmd,
    timeMin: `${mondayYmd}T00:00:00+09:00`,
    timeMax: `${nextMondayYmd}T00:00:00+09:00`,
  };
}
