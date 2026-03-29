import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import { createLLMProvider } from "@/lib/llm";
import { db } from "@/db";
import { briefings, userSettings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Busy Score 계산 함수
function calculateBusyScore(events: any[]): number {
  if (events.length === 0) return 0;

  let score = 0;

  // 1. 이벤트 수 (기본 20점/개, 최대 60점)
  score += Math.min(60, events.length * 20);

  // 2. 총 소요 시간 계산 (최대 30점)
  let totalMinutes = 0;
  events.forEach((event: any) => {
    const start = new Date(event.start?.dateTime || event.start?.date);
    const end = new Date(event.end?.dateTime || event.end?.date);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    totalMinutes += duration;
  });
  score += Math.min(30, (totalMinutes / 60) * 5); // 1시간당 5점

  // 3. 시간대 중복 체크 (최대 10점 추가)
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = new Date(a.start?.dateTime || a.start?.date).getTime();
    const bStart = new Date(b.start?.dateTime || b.start?.date).getTime();
    return aStart - bStart;
  });

  let overlaps = 0;
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = new Date(
      sortedEvents[i].end?.dateTime || sortedEvents[i].end?.date
    ).getTime();
    const nextStart = new Date(
      sortedEvents[i + 1].start?.dateTime || sortedEvents[i + 1].start?.date
    ).getTime();

    if (currentEnd > nextStart) {
      overlaps++;
    }
  }
  score += Math.min(10, overlaps * 5);

  return Math.min(100, Math.round(score));
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자 설정 가져오기
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
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

    // 이벤트를 LLM 형식으로 변환 + 참석자 이메일 수집
    const allAttendees = new Set<string>();
    const calendarEvents = events.map((event: any) => {
      const attendeeEmails = event.attendees?.map((a: any) => a.email) || [];
      attendeeEmails.forEach((email: string) => allAttendees.add(email));
      
      return {
        summary: event.summary || "제목 없음",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        description: event.description || "",
        attendees: attendeeEmails,
      };
    });

    // 참석자별 Gmail 컨텍스트 가져오기 (최대 5명, 각 3개 스레드)
    console.log(`[Gmail] Fetching context for ${allAttendees.size} attendees...`);
    const meetingContexts: Record<string, any[]> = {};
    
    let attendeeCount = 0;
    for (const attendeeEmail of allAttendees) {
      if (attendeeCount >= 5) break; // 최대 5명까지만
      
      try {
        const threads = await googleClient.getGmailThreads(
          `from:${attendeeEmail} OR to:${attendeeEmail}`,
          3
        );
        
        if (threads.length > 0) {
          meetingContexts[attendeeEmail] = threads.map((t: any) => ({
            id: t.id,
            snippet: t.snippet,
          }));
          console.log(`[Gmail] Found ${threads.length} threads for ${attendeeEmail}`);
        }
      } catch (error) {
        console.error(`[Gmail] Failed to fetch threads for ${attendeeEmail}:`, error);
      }
      
      attendeeCount++;
    }

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
    console.log(`[LLM] Provider: ${userConfig.llmProvider}`);
    if (userConfig.llmProvider === "lmstudio") {
      console.log(`[LLM] Endpoint: ${userConfig.lmStudioEndpoint}`);
      console.log(`[LLM] Model: ${userConfig.lmStudioModel}`);
    }
    console.log(`[LLM] Generating briefing for ${events.length} events...`);
    
    const summary = await llmProvider.generateBriefing(calendarEvents);
    console.log(`[LLM] Summary generated (${summary.length} chars)`);
    
    const actionItems = await llmProvider.extractActionItems(summary);
    console.log(`[LLM] Action items extracted: ${actionItems.length} items`);

    // Busy Score 계산 (개선된 로직)
    const busyScore = calculateBusyScore(events);
    console.log(`[Score] Busy score: ${busyScore}`);

    // 어제 브리핑 가져오기 (델타 계산용)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKorea = new Date(yesterday.getTime() + (9 * 60 * 60 * 1000));
    const yesterdayStr = yesterdayKorea.toISOString().split("T")[0];
    
    const yesterdayBriefing = await db
      .select()
      .from(briefings)
      .where(
        and(
          eq(briefings.userId, session.user.id),
          eq(briefings.date, yesterdayStr)
        )
      )
      .orderBy(desc(briefings.createdAt))
      .limit(1);

    // 델타 계산 (어제와 비교)
    let delta = null;
    if (yesterdayBriefing[0]) {
      const yesterdayEvents = yesterdayBriefing[0].actionItems 
        ? JSON.parse(yesterdayBriefing[0].actionItems).length 
        : 0;
      const todayEvents = actionItems.length;
      
      delta = {
        eventCountChange: todayEvents - yesterdayEvents,
        busyScoreChange: busyScore - (yesterdayBriefing[0].busyScore || 0),
      };
      
      console.log(`[DELTA] Event count: ${yesterdayEvents} -> ${todayEvents} (${delta.eventCountChange >= 0 ? '+' : ''}${delta.eventCountChange})`);
      console.log(`[DELTA] Busy score: ${yesterdayBriefing[0].busyScore} -> ${busyScore} (${delta.busyScoreChange >= 0 ? '+' : ''}${delta.busyScoreChange})`);
    }

    // 데이터베이스에 저장 (한국 시간 기준 날짜)
    const koreaTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const dateStr = koreaTime.toISOString().split("T")[0];
    const now = Date.now();
    
    console.log(`[DB] Saving briefing for date: ${dateStr}`);
    
    await db.insert(briefings).values({
      userId: session.user.id,
      date: dateStr,
      summary,
      actionItems: JSON.stringify(actionItems),
      busyScore,
      llmProvider: userConfig.llmProvider,
      llmModel: userConfig.llmProvider === "lmstudio" ? userConfig.lmStudioModel : "gpt-4o-mini",
      llmEndpoint: userConfig.llmProvider === "lmstudio" ? userConfig.lmStudioEndpoint : undefined,
      meetingContexts: JSON.stringify(meetingContexts),
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
        llmProvider: userConfig.llmProvider,
        llmModel: userConfig.llmProvider === "lmstudio" ? userConfig.lmStudioModel : "gpt-4o-mini",
        delta,
        meetingContexts,
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
