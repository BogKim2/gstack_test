import { google } from "googleapis";
import { normalizeOAuthExpiryMs } from "@/lib/oauth-expiry";

export interface GoogleAPIConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function isUnauthorizedError(error: unknown): boolean {
  const e = error as { code?: number; response?: { status?: number } };
  return e?.code === 401 || e?.response?.status === 401;
}

export class GoogleAPIClient {
  private oauth2Client;
  private threadDetailCache = new Map<string, unknown>();

  constructor(config: GoogleAPIConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    const expiryMs = normalizeOAuthExpiryMs(config.expiresAt) ?? Date.now();

    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expiry_date: expiryMs,
    });
  }

  private async forceRefreshAccessToken(): Promise<void> {
    await this.oauth2Client.getAccessToken();
  }

  private async withRetry401<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await this.forceRefreshAccessToken();
        return await fn();
      }
      throw error;
    }
  }

  async getCalendarEvents(timeMin: string, timeMax: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });

    try {
      const response = await this.withRetry401(() =>
        calendar.events.list({
          calendarId: "primary",
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
        })
      );

      return response.data.items || [];
    } catch (error) {
      console.error("Calendar API error:", error);
      throw error;
    }
  }

  async getGmailThreads(query: string, maxResults: number = 10) {
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    try {
      const response = await this.withRetry401(() =>
        gmail.users.threads.list({
          userId: "me",
          q: query,
          maxResults,
        })
      );

      return response.data.threads || [];
    } catch (error) {
      console.error("Gmail API error:", error);
      throw error;
    }
  }

  async getGmailThread(threadId: string) {
    if (this.threadDetailCache.has(threadId)) {
      return this.threadDetailCache.get(threadId);
    }

    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    try {
      const response = await this.withRetry401(() =>
        gmail.users.threads.get({
          userId: "me",
          id: threadId,
        })
      );

      const data = response.data;
      this.threadDetailCache.set(threadId, data);
      return data;
    } catch (error) {
      console.error("Gmail thread error:", error);
      throw error;
    }
  }

  clearThreadCache() {
    this.threadDetailCache.clear();
  }
}
