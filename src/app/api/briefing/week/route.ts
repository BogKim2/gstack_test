import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";

export async function GET(request: Request) {
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

    // URL에서 weekOffset 파라미터 가져오기 (기본값: 0 = 이번 주)
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0");

    // 이번 주 월요일 구하기 (한국 시간 기준)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const dayOfWeek = koreaTime.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일이면 -6, 아니면 1-요일
    
    const monday = new Date(koreaTime);
    monday.setDate(monday.getDate() + diffToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    console.log(`[Week] Fetching events: ${monday.toISOString()} ~ ${sunday.toISOString()}`);

    const events = await googleClient.getCalendarEvents(
      monday.toISOString(),
      sunday.toISOString()
    );

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: "이번 주 일정이 없습니다",
        events: [],
        weekStart: monday.toISOString().split("T")[0],
        weekEnd: sunday.toISOString().split("T")[0],
      });
    }

    // 날짜별로 그룹화
    const eventsByDay: Record<string, any[]> = {};
    
    events.forEach((event: any) => {
      const startDate = event.start?.dateTime || event.start?.date;
      if (!startDate) return;
      
      const date = new Date(startDate);
      const koreaDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const dateKey = koreaDate.toISOString().split("T")[0];
      
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

    // 주간 통계
    const stats = {
      totalEvents: events.length,
      totalDays: Object.keys(eventsByDay).length,
      busiestDay: Object.entries(eventsByDay).reduce(
        (max, [date, evts]) => (evts.length > max.count ? { date, count: evts.length } : max),
        { date: "", count: 0 }
      ),
    };

    console.log(`[Week] Found ${events.length} events across ${stats.totalDays} days`);

    return NextResponse.json({
      events: eventsByDay,
      weekStart: monday.toISOString().split("T")[0],
      weekEnd: sunday.toISOString().split("T")[0],
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
