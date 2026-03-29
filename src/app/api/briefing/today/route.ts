import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSeoulYmd } from "@/lib/korea-time";
import { requireUserId } from "@/lib/require-auth";

export async function GET() {
  try {
    const session = await auth();

    if (!requireUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateStr = getSeoulYmd();

    const result = await db
      .select()
      .from(briefings)
      .where(
        and(
          eq(briefings.userId, session.user.id),
          eq(briefings.date, dateStr)
        )
      )
      .orderBy(desc(briefings.createdAt))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ briefing: null });
    }

    const briefing = result[0];

    return NextResponse.json({
      briefing: {
        id: briefing.id,
        date: briefing.date,
        summary: briefing.summary,
        actionItems: briefing.actionItems ? JSON.parse(briefing.actionItems) : [],
        busyScore: briefing.busyScore,
        createdAt: briefing.createdAt,
      },
    });
  } catch (error) {
    console.error("Briefing fetch error:", error);
    return NextResponse.json(
      { error: "브리핑 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
