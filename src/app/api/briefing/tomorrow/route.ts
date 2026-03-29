import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import {
  addCalendarDaysYmd,
  getEventStartSeoulYmd,
  getSeoulYmd,
  seoulDayRangeIso,
} from "@/lib/korea-time";
import { requireUserId } from "@/lib/require-auth";

export async function GET() {
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

    const todaySeoul = getSeoulYmd();
    const tomorrowSeoul = addCalendarDaysYmd(todaySeoul, 1);
    const { timeMin, timeMax } = seoulDayRangeIso(tomorrowSeoul);

    console.log(
      `[Tomorrow] Seoul today=${todaySeoul} tomorrow=${tomorrowSeoul} range ${timeMin} .. ${timeMax}`
    );

    const rawEvents = await googleClient.getCalendarEvents(timeMin, timeMax);

    const events = (rawEvents || []).filter((ev: any) => {
      const ymd = getEventStartSeoulYmd(ev);
      return ymd === tomorrowSeoul;
    });

    if (events.length === 0) {
      return NextResponse.json({
        message: "내일 일정이 없습니다",
        events: [],
        dateLabel: tomorrowSeoul,
      });
    }

    const keyEvents = events.slice(0, 3).map((event: any) => ({
      summary: event.summary || "제목 없음",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      attendees: event.attendees?.length || 0,
    }));

    console.log(
      `[Tomorrow] API returned ${rawEvents?.length ?? 0}, after Seoul-day filter: ${events.length}`
    );

    return NextResponse.json({
      events: keyEvents,
      totalCount: events.length,
      dateLabel: tomorrowSeoul,
    });
  } catch (error) {
    console.error("Tomorrow preview error:", error);
    return NextResponse.json(
      { error: "내일 일정을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
