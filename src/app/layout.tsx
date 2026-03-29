import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Daily Briefing",
  description: "AI-powered daily calendar briefing",
  keywords: ["브리핑", "캘린더", "Google Calendar", "Gmail", "LLM"],
  openGraph: {
    title: "Daily Briefing",
    description: "한국어 일일 캘린더 브리핑",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={GeistSans.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
