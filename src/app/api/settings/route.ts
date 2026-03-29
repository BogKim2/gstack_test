import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (result.length === 0) {
      // 기본 설정 반환
      return NextResponse.json({
        settings: {
          llmProvider: "lmstudio",
          lmStudioEndpoint: process.env.LM_STUDIO_ENDPOINT || "http://192.168.0.2:1234/v1",
          lmStudioModel: process.env.LM_STUDIO_MODEL || "nvidia/nemotron-3-nano-4b",
          promptPreset: "default",
        },
      });
    }

    return NextResponse.json({ settings: result[0] });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "설정 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { llmProvider, lmStudioEndpoint, lmStudioModel, promptPreset } = body;

    // 기존 설정 확인
    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    const now = Date.now();

    if (existing.length === 0) {
      // 새로 생성
      await db.insert(userSettings).values({
        userId: session.user.id,
        llmProvider,
        lmStudioEndpoint,
        lmStudioModel,
        promptPreset,
        updatedAt: now,
      });
    } else {
      // 업데이트
      await db
        .update(userSettings)
        .set({
          llmProvider,
          lmStudioEndpoint,
          lmStudioModel,
          promptPreset,
          updatedAt: now,
        })
        .where(eq(userSettings.userId, session.user.id));
    }

    return NextResponse.json({
      message: "설정이 저장되었습니다",
      settings: {
        llmProvider,
        lmStudioEndpoint,
        lmStudioModel,
        promptPreset,
      },
    });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { error: "설정 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
