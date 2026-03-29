import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import { createLLMProvider } from "@/lib/llm";
import { db } from "@/db";
import { briefings, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 설정 가져오기
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.email))
      .limit(1);

    const userConfig = settings[0] || {
      llmProvider: "lmstudio",
      lmStudioEndpoint: process.env.LM_STUDIO_ENDPOINT || "http://192.168.0.2:1234/v1",
      lmStudioModel: process.env.LM_STUDIO_MODEL || "nvidia/nemotron-3-nano-4b",
    };

    // Google API 클라이언트 초기화
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

    // 오늘 일정 가져오기
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await googleClient.getCalendarEvents(
      today.toISOString(),
      tomorrow.toISOString()
    );

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: "오늘 일정이 없습니다",
        briefing: null,
      });
    }

    // 이벤트를 LLM 형식으로 변환
    const calendarEvents = events.map((event: any) => ({
      summary: event.summary || "제목 없음",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      description: event.description || "",
      attendees: event.attendees?.map((a: any) => a.email) || [],
    }));

    // LLM 프로바이더 생성
    const llmProvider = createLLMProvider(
      userConfig.llmProvider as "openai" | "lmstudio",
      {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: userConfig.lmStudioEndpoint || undefined,
        model: userConfig.lmStudioModel || undefined,
      }
    );

    // 브리핑 생성
    const summary = await llmProvider.generateBriefing(calendarEvents);
    const actionItems = await llmProvider.extractActionItems(summary);

    // Busy Score 계산 (간단한 로직: 이벤트 수 기반)
    const busyScore = Math.min(100, events.length * 20);

    // 데이터베이스에 저장
    const dateStr = today.toISOString().split("T")[0];
    const now = Date.now();
    
    await db.insert(briefings).values({
      userId: session.user.email,
      date: dateStr,
      summary,
      actionItems: JSON.stringify(actionItems),
      busyScore,
      createdAt: now,
    });

    return NextResponse.json({
      message: "브리핑이 생성되었습니다",
      briefing: {
        date: dateStr,
        summary,
        actionItems,
        busyScore,
        eventCount: events.length,
      },
    });
  } catch (error) {
    console.error("Briefing generation error:", error);
    return NextResponse.json(
      { error: "브리핑 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
