import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const result = await db
      .select()
      .from(briefings)
      .where(
        and(
          eq(briefings.userId, session.user.email),
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
