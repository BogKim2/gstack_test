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
