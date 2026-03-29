import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { GoogleAPIClient } from "@/lib/google-api";
import { createLLMProvider, type BriefingLLMOptions, type PromptPreset } from "@/lib/llm";
import { db } from "@/db";
import { briefings, userSettings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  addCalendarDaysYmd,
  getEventStartSeoulYmd,
  getSeoulYmd,
  seoulDayRangeIso,
} from "@/lib/korea-time";
import { requireUserId } from "@/lib/require-auth";
import { rateLimitBriefingGenerate } from "@/lib/rate-limit";

function calculateBusyScore(events: any[]): number {
  if (events.length === 0) return 0;

  let score = 0;
  score += Math.min(60, events.length * 20);

  let totalMinutes = 0;
  events.forEach((event: any) => {
    const start = new Date(event.start?.dateTime || event.start?.date);
    const end = new Date(event.end?.dateTime || event.end?.date);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    totalMinutes += duration;
  });
  score += Math.min(30, (totalMinutes / 60) * 5);

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

function dedupeAttendees(emails: string[], excludeEmail?: string | null): string[] {
  const ex = excludeEmail?.toLowerCase().trim();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const e = raw?.trim();
    if (!e) continue;
    const lower = e.toLowerCase();
    if (ex && lower === ex) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(e);
  }
  return out.sort((a, b) => a.localeCompare(b)).slice(0, 5);
}

function buildMeetingContextHint(
  contexts: Record<string, { id: string; snippet: string }[]>
): string {
  return Object.entries(contexts)
    .map(([email, threads]) => `${email}:\n${threads.map((t) => t.snippet).join("\n")}`)
    .join("\n\n");
}

export async function POST(request: Request) {
  let body: { stream?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const useStream = body.stream === true;

  try {
    const session = await auth();

    if (!requireUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimitBriefingGenerate(session.user.id);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      );
    }

    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    const userConfig = settings[0] || {
      llmProvider: "lmstudio",
      lmStudioEndpoint: process.env.LM_STUDIO_ENDPOINT || "http://192.168.0.2:1234/v1",
      lmStudioModel: process.env.LM_STUDIO_MODEL || "nvidia/nemotron-3-nano-4b",
      promptPreset: "default",
    };

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
    const { timeMin, timeMax } = seoulDayRangeIso(todaySeoul);
    const rawEvents = await googleClient.getCalendarEvents(timeMin, timeMax);
    const events = (rawEvents || []).filter((ev: any) =>
      getEventStartSeoulYmd(ev) === todaySeoul
    );

    if (!events || events.length === 0) {
      if (useStream) {
        const encoder = new TextEncoder();
        const payload = JSON.stringify({
          type: "done",
          message: "오늘 일정이 없습니다",
          briefing: null,
        });
        return new Response(encoder.encode(payload + "\n"), {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
      return NextResponse.json({
        message: "오늘 일정이 없습니다",
        briefing: null,
      });
    }

    const allAttendees: string[] = [];
    const calendarEvents = events.map((event: any) => {
      const attendeeEmails = event.attendees?.map((a: any) => a.email).filter(Boolean) || [];
      attendeeEmails.forEach((email: string) => allAttendees.push(email));

      return {
        summary: event.summary || "제목 없음",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        description: event.description || "",
        attendees: attendeeEmails,
      };
    });

    const attendeeList = dedupeAttendees(
      allAttendees,
      session.user.email ?? undefined
    );
    const warnings: string[] = [];
    const meetingContexts: Record<string, { id: string; snippet: string }[]> = {};

    console.log(`[Gmail] Fetching context for ${attendeeList.length} attendees...`);

    for (const attendeeEmail of attendeeList) {
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
        const msg = error instanceof Error ? error.message : "요청 실패";
        warnings.push(`Gmail(${attendeeEmail}): ${msg}`);
        console.error(`[Gmail] Failed to fetch threads for ${attendeeEmail}:`, error);
      }
    }

    const promptPreset = (userConfig.promptPreset || "default") as PromptPreset;
    const meetingContextHint = buildMeetingContextHint(meetingContexts);
    const llmOptions: BriefingLLMOptions = {
      promptPreset,
      meetingContextHint: meetingContextHint.trim() ? meetingContextHint : undefined,
    };

    const llmProvider = createLLMProvider(
      userConfig.llmProvider as "openai" | "lmstudio",
      {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: userConfig.lmStudioEndpoint || undefined,
        model: userConfig.lmStudioModel || undefined,
      }
    );

    console.log(`[LLM] Provider: ${userConfig.llmProvider}, preset: ${promptPreset}`);
    if (userConfig.llmProvider === "lmstudio") {
      console.log(`[LLM] Endpoint: ${userConfig.lmStudioEndpoint}`);
      console.log(`[LLM] Model: ${userConfig.lmStudioModel}`);
    }

    const busyScore = calculateBusyScore(events);
    console.log(`[Score] Busy score: ${busyScore}`);

    const yesterdayStr = addCalendarDaysYmd(todaySeoul, -1);
    const yesterdayBriefing = await db
      .select()
      .from(briefings)
      .where(
        and(eq(briefings.userId, session.user.id), eq(briefings.date, yesterdayStr))
      )
      .orderBy(desc(briefings.createdAt))
      .limit(1);

    const dateStr = todaySeoul;
    const now = Date.now();

    const persistAndDelta = async (summary: string, actionItems: string[]) => {
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
      }

      await db.insert(briefings).values({
        userId: session.user.id,
        date: dateStr,
        summary,
        actionItems: JSON.stringify(actionItems),
        busyScore,
        llmProvider: userConfig.llmProvider,
        llmModel:
          userConfig.llmProvider === "lmstudio"
            ? userConfig.lmStudioModel
            : "gpt-4o-mini",
        llmEndpoint:
          userConfig.llmProvider === "lmstudio" ? userConfig.lmStudioEndpoint : undefined,
        meetingContexts: JSON.stringify(meetingContexts),
        warnings: warnings.length ? JSON.stringify(warnings) : null,
        createdAt: now,
      });

      return {
        date: dateStr,
        summary,
        actionItems,
        busyScore,
        eventCount: events.length,
        llmProvider: userConfig.llmProvider,
        llmModel:
          userConfig.llmProvider === "lmstudio"
            ? userConfig.lmStudioModel
            : "gpt-4o-mini",
        delta,
        meetingContexts,
        warnings: warnings.length ? warnings : undefined,
        createdAt: now,
      };
    };

    if (useStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (obj: unknown) => {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
          };

          try {
            let summary = "";
            for await (const chunk of llmProvider.generateBriefingStream(
              calendarEvents,
              llmOptions
            )) {
              summary += chunk;
              send({ type: "chunk", text: chunk });
            }

            console.log(`[LLM] Summary streamed (${summary.length} chars)`);
            const actionItems = await llmProvider.extractActionItems(summary);
            console.log(`[LLM] Action items: ${actionItems.length}`);

            const briefingPayload = await persistAndDelta(summary, actionItems);
            send({
              type: "done",
              message: "브리핑이 생성되었습니다",
              briefing: briefingPayload,
            });
          } catch (e) {
            send({
              type: "error",
              message: e instanceof Error ? e.message : "브리핑 생성 중 오류",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    console.log(`[LLM] Generating briefing for ${events.length} events...`);
    const summary = await llmProvider.generateBriefing(calendarEvents, llmOptions);
    console.log(`[LLM] Summary generated (${summary.length} chars)`);

    const actionItems = await llmProvider.extractActionItems(summary);
    console.log(`[LLM] Action items extracted: ${actionItems.length} items`);

    const briefingPayload = await persistAndDelta(summary, actionItems);

    return NextResponse.json({
      message: "브리핑이 생성되었습니다",
      briefing: briefingPayload,
    });
  } catch (error) {
    console.error("Briefing generation error:", error);
    return NextResponse.json(
      { error: "브리핑 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
