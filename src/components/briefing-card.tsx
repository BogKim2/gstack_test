"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { MeetingContext } from "@/components/meeting-context";

interface Delta {
  eventCountChange: number;
  busyScoreChange: number;
}

interface Thread {
  id: string;
  snippet: string;
}

interface Briefing {
  id: string;
  date: string;
  summary: string;
  actionItems: string[];
  busyScore: number;
  createdAt: number;
  llmProvider?: string;
  llmModel?: string;
  llmEndpoint?: string;
  delta?: Delta | null;
  meetingContexts?: Record<string, Thread[]>;
}

interface BriefingCardProps {
  initialBriefing: Briefing | null;
}

export function BriefingCard({ initialBriefing }: BriefingCardProps) {
  const [briefing, setBriefing] = useState<Briefing | null>(initialBriefing);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/briefing/generate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "브리핑 생성 실패");
      }

      if (data.briefing) {
        setBriefing(data.briefing);
        toast.success("브리핑이 생성되었습니다!");
      } else {
        toast.info(data.message || "오늘 일정이 없습니다");
      }
    } catch (error) {
      console.error("Briefing generation error:", error);
      toast.error(error instanceof Error ? error.message : "브리핑 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (!briefing) {
    const koreaTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    return (
      <Card>
        <CardHeader>
          <CardTitle>오늘의 브리핑</CardTitle>
          <CardDescription>
            {koreaTime.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                아직 생성된 브리핑이 없습니다
              </p>
              <Button onClick={generateBriefing} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "브리핑 생성"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBusyScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 50) return "text-orange-600";
    return "text-green-600";
  };

  const getBusyScoreLabel = (score: number) => {
    if (score >= 80) return "매우 바쁨";
    if (score >= 50) return "보통";
    return "여유로움";
  };

  const getDeltaIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getDeltaVariant = (change: number): "default" | "secondary" | "destructive" | "outline" => {
    if (change > 0) return "destructive";
    if (change < 0) return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>오늘의 브리핑</CardTitle>
            <CardDescription>
              {new Date(briefing.date + "T00:00:00+09:00").toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getBusyScoreColor(briefing.busyScore)}`}>
              {briefing.busyScore}
            </div>
            <div className="text-xs text-muted-foreground">
              {getBusyScoreLabel(briefing.busyScore)}
            </div>
            {briefing.delta && (
              <div className="mt-2 flex items-center justify-end gap-1">
                <Badge variant={getDeltaVariant(briefing.delta.busyScoreChange)} className="text-xs">
                  {getDeltaIcon(briefing.delta.busyScoreChange)}
                  <span className="ml-1">
                    {briefing.delta.busyScoreChange > 0 ? '+' : ''}{briefing.delta.busyScoreChange}
                  </span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">요약</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {briefing.summary}
          </p>
        </div>

        {briefing.actionItems && briefing.actionItems.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">액션 아이템</h3>
            <ul className="space-y-2">
              {briefing.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {briefing.meetingContexts && Object.keys(briefing.meetingContexts).length > 0 && (
          <MeetingContext contexts={briefing.meetingContexts} />
        )}

        {briefing.llmProvider && (
          <div className="rounded-lg border bg-muted/50 p-3 text-xs">
            <div className="font-semibold mb-1">LLM 호출 정보</div>
            <div className="space-y-0.5 text-muted-foreground">
              <div>프로바이더: {briefing.llmProvider === "lmstudio" ? "LM Studio (로컬)" : "OpenAI"}</div>
              <div>모델: {briefing.llmModel || "알 수 없음"}</div>
              {briefing.llmEndpoint && (
                <div>엔드포인트: {briefing.llmEndpoint}</div>
              )}
              <div>
                생성 시각: {mounted ? new Date(briefing.createdAt).toLocaleString("ko-KR") : "로딩 중..."}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={generateBriefing} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                재생성 중...
              </>
            ) : (
              "브리핑 재생성"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
