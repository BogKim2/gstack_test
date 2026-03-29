/**
 * 프로세스 단위 인메모리 레이트 리밋 (단일 인스턴스·개발용에 적합).
 * 프로덕션 다중 인스턴스에서는 Redis 등 외부 저장소 사용 권장.
 */
type Bucket = { count: number; windowStart: number };

const store = new Map<string, Bucket>();

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (b.count >= limit) {
    const retryAfterMs = Math.max(0, b.windowStart + windowMs - now);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }
  b.count += 1;
  return { ok: true };
}

/** 브리핑 생성: 분당 최대 횟수 */
export function rateLimitBriefingGenerate(userId: string) {
  return checkRateLimit(`briefing:generate:${userId}`, 20, 60_000);
}

/** 주간 LLM 요약: 분당 최대 횟수 */
export function rateLimitWeekSummary(userId: string) {
  return checkRateLimit(`briefing:week-summary:${userId}`, 30, 60_000);
}
