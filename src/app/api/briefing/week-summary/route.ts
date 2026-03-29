import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import { createLLMProvider, type WeekSummaryItem } from "@/lib/llm";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getEventStartSeoulYmd,
  getSeoulRolling7DayRange,
  getSeoulYmd,
} from "@/lib/korea-time";
import { requireUserId } from "@/lib/require-auth";
import { rateLimitWeekSummary } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!requireUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimitWeekSummary(session.user.id);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      );
    }

    if (!session.accessToken || !session.refreshToken || !session.expiresAt) {
      return NextResponse.json(
        { error: "Missing OAuth tokens" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10) || 0;

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

    const googleClient = new GoogleAPIClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    const todaySeoul = getSeoulYmd();
    const { startYmd, endYmd, timeMin, timeMax } = getSeoulRolling7DayRange(
      todaySeoul,
      weekOffset
    );

    const rawEvents = await googleClient.getCalendarEvents(timeMin, timeMax);

    const inWeek = (rawEvents || []).filter((event: any) => {
      const ymd = getEventStartSeoulYmd(event);
      if (!ymd) return false;
      return ymd >= startYmd && ymd <= endYmd;
    });

    if (inWeek.length === 0) {
      return NextResponse.json({
        summary: "",
        weekStart: startYmd,
        weekEnd: endYmd,
        message: "이번 7일간 일정이 없습니다",
      });
    }

    const items = inWeek
      .map((event: any) => {
        const dateYmd = getEventStartSeoulYmd(event);
        if (!dateYmd) return null;
        return {
          dateYmd,
          summary: event.summary || "제목 없음",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
        };
      })
      .filter(Boolean) as WeekSummaryItem[];

    items.sort((a, b) => {
      const t = new Date(a.start).getTime() - new Date(b.start).getTime();
      return Number.isNaN(t) ? a.dateYmd.localeCompare(b.dateYmd) : t;
    });

    const llm = createLLMProvider(userConfig.llmProvider as "openai" | "lmstudio", {
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: userConfig.lmStudioEndpoint || undefined,
      model: userConfig.lmStudioModel || undefined,
    });

    const summary = await llm.generateWeekSummary(items);

    return NextResponse.json({
      summary,
      weekStart: startYmd,
      weekEnd: endYmd,
    });
  } catch (error) {
    console.error("Week summary error:", error);
    return NextResponse.json(
      { error: "주간 요약 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
