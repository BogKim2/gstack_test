import type { Session } from "next-auth";

/** API 인증: 이메일 없이도 소셜 로그인 가능하도록 `user.id`만 검사 */
export function requireUserId(
  session: Session | null
): session is Session & { user: { id: string } } {
  return session != null && Boolean(session.user?.id);
}
