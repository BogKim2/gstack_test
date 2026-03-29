import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Google Calendar / Gmail API용 (연동된 Google 계정) */
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    /** Google OAuth 연동 완료 여부 */
    googleLinked?: boolean;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    id?: string;
  }
}
