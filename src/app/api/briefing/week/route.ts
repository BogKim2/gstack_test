import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import {
  getEventStartSeoulYmd,
  getSeoulRolling7DayRange,
  getSeoulYmd,
} from "@/lib/korea-time";
import { requireUserId } from "@/lib/require-auth";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!requireUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken || !session.refreshToken || !session.expiresAt) {
      return NextResponse.json(
        { error: "Missing OAuth tokens" },
        { status: 400 }
      );
    }

    const googleClient = new GoogleAPIClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10) || 0;

    const todaySeoul = getSeoulYmd();
    const { startYmd, endYmd, timeMin, timeMax } = getSeoulRolling7DayRange(
      todaySeoul,
      weekOffset
    );

    console.log(
      `[Week] Rolling 7d ${startYmd}..${endYmd} ${timeMin} .. ${timeMax}`
    );

    const rawEvents = await googleClient.getCalendarEvents(timeMin, timeMax);

    const inWeek = (rawEvents || []).filter((event: any) => {
      const ymd = getEventStartSeoulYmd(event);
      if (!ymd) return false;
      return ymd >= startYmd && ymd <= endYmd;
    });

    if (inWeek.length === 0) {
      return NextResponse.json({
        message: "이번 7일간 일정이 없습니다",
        events: {},
        weekStart: startYmd,
        weekEnd: endYmd,
        stats: {
          totalEvents: 0,
          totalDays: 0,
          busiestDay: { date: "", count: 0 },
        },
      });
    }

    const eventsByDay: Record<string, any[]> = {};

    inWeek.forEach((event: any) => {
      const dateKey = getEventStartSeoulYmd(event);
      if (!dateKey) return;

      if (!eventsByDay[dateKey]) {
        eventsByDay[dateKey] = [];
      }

      eventsByDay[dateKey].push({
        id: event.id,
        summary: event.summary || "제목 없음",
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        description: event.description || "",
        attendees: event.attendees?.length || 0,
      });
    });

    const stats = {
      totalEvents: inWeek.length,
      totalDays: Object.keys(eventsByDay).length,
      busiestDay: Object.entries(eventsByDay).reduce(
        (max, [date, evts]) =>
          evts.length > max.count ? { date, count: evts.length } : max,
        { date: "", count: 0 }
      ),
    };

    console.log(`[Week] Found ${inWeek.length} events across ${stats.totalDays} days`);

    return NextResponse.json({
      events: eventsByDay,
      weekStart: startYmd,
      weekEnd: endYmd,
      stats,
    });
  } catch (error) {
    console.error("Week view error:", error);
    return NextResponse.json(
      { error: "주간 일정을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
