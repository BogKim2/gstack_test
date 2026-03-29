import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
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

    // 내일 일정 가져오기 (한국 시간 기준)
    const now = new Date();
    const koreaToday = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const tomorrow = new Date(koreaToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(`[Tomorrow] Fetching events: ${tomorrow.toISOString()} ~ ${dayAfterTomorrow.toISOString()}`);

    const events = await googleClient.getCalendarEvents(
      tomorrow.toISOString(),
      dayAfterTomorrow.toISOString()
    );

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: "내일 일정이 없습니다",
        events: [],
      });
    }

    // 주요 이벤트만 필터링 (상위 3개)
    const keyEvents = events.slice(0, 3).map((event: any) => ({
      summary: event.summary || "제목 없음",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      attendees: event.attendees?.length || 0,
    }));

    console.log(`[Tomorrow] Found ${events.length} events, returning top ${keyEvents.length}`);

    return NextResponse.json({
      events: keyEvents,
      totalCount: events.length,
    });
  } catch (error) {
    console.error("Tomorrow preview error:", error);
    return NextResponse.json(
      { error: "내일 일정을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
