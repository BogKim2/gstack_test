import { rateLimitBriefingGenerate } from "./rate-limit";

describe("rate-limit", () => {
  it("같은 사용자는 허용 한도 내에서 통과한다", () => {
    const uid = "test-user-1";
    for (let i = 0; i < 5; i++) {
      const r = rateLimitBriefingGenerate(uid);
      expect(r.ok).toBe(true);
    }
  });
});
