import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import {
  decryptOAuthTokenIfConfigured,
  encryptOAuthTokenIfConfigured,
} from "@/lib/crypto";
import { normalizeOAuthExpiryMs } from "@/lib/oauth-expiry";
import { getGoogleAccountTokensForUser } from "@/lib/auth-google-tokens";

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope:
        "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline",
      prompt: "consent",
    },
  },
});

function buildProviders(): NextAuthConfig["providers"] {
  const list: NextAuthConfig["providers"] = [googleProvider];

  if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
    list.push(
      Kakao({
        clientId: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "profile_nickname profile_image account_email",
          },
        },
      })
    );
  }

  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    list.push(
      Naver({
        clientId: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
      })
    );
  }

  return list;
}

export const authConfig = {
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.id = user.id;
      }

      if (account) {
        if (account.provider === "google") {
          token.accessToken = account.access_token;
          token.refreshToken = encryptOAuthTokenIfConfigured(
            account.refresh_token ?? undefined
          );
          token.expiresAt = normalizeOAuthExpiryMs(account.expires_at ?? undefined);
        } else if (account.provider === "kakao" || account.provider === "naver") {
          const uid = user?.id ?? (token.id as string | undefined);
          if (uid) {
            const g = await getGoogleAccountTokensForUser(uid);
            if (g) {
              token.accessToken = g.accessToken;
              token.refreshToken = encryptOAuthTokenIfConfigured(
                g.refreshToken ?? undefined
              );
              token.expiresAt = normalizeOAuthExpiryMs(g.expiresAt ?? undefined);
            } else {
              delete token.accessToken;
              delete token.refreshToken;
              delete token.expiresAt;
            }
          } else {
            delete token.accessToken;
            delete token.refreshToken;
            delete token.expiresAt;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = decryptOAuthTokenIfConfigured(
        token.refreshToken as string | undefined
      ) as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      session.googleLinked = Boolean(token.accessToken);
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
