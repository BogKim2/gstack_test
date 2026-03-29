describe("OAuth token crypto", () => {
  const prev = process.env.SECRET_KEY;

  beforeAll(() => {
    process.env.SECRET_KEY = "test-secret-key-32-bytes-long!!";
  });

  afterAll(() => {
    process.env.SECRET_KEY = prev;
  });

  it("암호화 후 복호화하면 원문과 같다", async () => {
    const { encryptOAuthToken, decryptOAuthToken } = await import("./crypto");
    const plain = "refresh_token_value";
    const enc = encryptOAuthToken(plain);
    expect(enc.startsWith("enc1:")).toBe(true);
    expect(decryptOAuthToken(enc)).toBe(plain);
  });
});
