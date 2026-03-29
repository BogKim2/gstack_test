/** Google OAuth expires_at: 초/밀리초 혼재 → google-auth용 밀리초 */
export function normalizeOAuthExpiryMs(expiresAt: number | undefined | null): number | undefined {
  if (expiresAt == null || Number.isNaN(expiresAt)) return undefined;
  if (expiresAt < 1e12) return Math.round(expiresAt * 1000);
  return Math.round(expiresAt);
}
