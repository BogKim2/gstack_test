import { google } from "googleapis";

export interface GoogleAPIConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class GoogleAPIClient {
  private oauth2Client;

  constructor(config: GoogleAPIConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expiry_date: config.expiresAt,
    });
  }

  async getCalendarEvents(timeMin: string, timeMax: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Calendar API error:", error);
      throw error;
    }
  }

  async getGmailThreads(query: string, maxResults: number = 10) {
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    try {
      const response = await gmail.users.threads.list({
        userId: "me",
        q: query,
        maxResults,
      });

      return response.data.threads || [];
    } catch (error) {
      console.error("Gmail API error:", error);
      throw error;
    }
  }

  async getGmailThread(threadId: string) {
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    try {
      const response = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
      });

      return response.data;
    } catch (error) {
      console.error("Gmail thread error:", error);
      throw error;
    }
  }
}
