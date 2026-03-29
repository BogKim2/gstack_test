import {
  addCalendarDaysYmd,
  getSeoulMondayOfWeek,
  getSeoulWeekRange,
  getSeoulWeekdaySun0,
  seoulDayRangeIso,
} from "./korea-time";

describe("korea-time", () => {
  it("addCalendarDaysYmd adds one day", () => {
    expect(addCalendarDaysYmd("2026-03-29", 1)).toBe("2026-03-30");
  });

  it("getSeoulWeekdaySun0: 2026-03-29 is Sunday", () => {
    expect(getSeoulWeekdaySun0("2026-03-29")).toBe(0);
  });

  it("getSeoulMondayOfWeek from Sunday lands on same week Monday", () => {
    expect(getSeoulMondayOfWeek("2026-03-29", 0)).toBe("2026-03-23");
  });

  it("getSeoulWeekRange covers Mon–Sun", () => {
    const r = getSeoulWeekRange("2026-03-29", 0);
    expect(r.mondayYmd).toBe("2026-03-23");
    expect(r.sundayYmd).toBe("2026-03-29");
    expect(r.timeMin).toBe("2026-03-23T00:00:00+09:00");
    expect(r.timeMax).toBe("2026-03-30T00:00:00+09:00");
  });

  it("seoulDayRangeIso is half-open", () => {
    const { timeMin, timeMax } = seoulDayRangeIso("2026-03-30");
    expect(timeMin).toBe("2026-03-30T00:00:00+09:00");
    expect(timeMax).toBe("2026-03-31T00:00:00+09:00");
  });
});
