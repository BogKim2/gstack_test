import { db } from "@/db";
import { accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** 같은 사용자에 연결된 Google OAuth 계정(일정·Gmail용) */
export async function getGoogleAccountTokensForUser(userId: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
} | null> {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")))
    .limit(1);

  const row = rows[0];
  if (!row?.access_token) return null;

  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token ?? null,
    expiresAt: row.expires_at ?? null,
  };
}
