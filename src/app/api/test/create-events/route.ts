import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";

const TEST_EVENTS = [
  {
    summary: "팀 스탠드업 미팅",
    description: "일일 진행상황 공유 및 블로커 논의",
    duration: 30,
    startHour: 9,
  },
  {
    summary: "프로젝트 기획 회의",
    description: "Q2 로드맵 검토 및 우선순위 조정",
    duration: 60,
    startHour: 10,
  },
  {
    summary: "점심 미팅 - 클라이언트",
    description: "신규 프로젝트 제안 논의",
    duration: 90,
    startHour: 12,
  },
  {
    summary: "코드 리뷰",
    description: "PR #123 리뷰 및 피드백",
    duration: 45,
    startHour: 14,
  },
  {
    summary: "1:1 미팅 - 팀원",
    description: "커리어 개발 및 목표 설정",
    duration: 30,
    startHour: 15,
  },
  {
    summary: "디자인 시스템 워크샵",
    description: "새로운 컴포넌트 라이브러리 도입 검토",
    duration: 60,
    startHour: 16,
  },
];

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken || !session.refreshToken || !session.expiresAt) {
      return NextResponse.json(
        { error: "Missing OAuth tokens" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 요청에서 개수 가져오기 (기본 3개)
    const body = await request.json();
    const count = Math.min(body.count || 3, TEST_EVENTS.length);

    // 랜덤하게 선택
    const shuffled = [...TEST_EVENTS].sort(() => Math.random() - 0.5);
    const selectedEvents = shuffled.slice(0, count);

    const today = new Date();
    const createdEvents = [];

    for (const event of selectedEvents) {
      const startTime = new Date(today);
      startTime.setHours(event.startHour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + event.duration);

      const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "Asia/Seoul",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "Asia/Seoul",
          },
        },
      });

      createdEvents.push({
        id: result.data.id,
        summary: event.summary,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      });
    }

    return NextResponse.json({
      message: `${count}개의 테스트 일정이 생성되었습니다`,
      events: createdEvents,
    });
  } catch (error) {
    console.error("Test events creation error:", error);
    return NextResponse.json(
      { error: "테스트 일정 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
