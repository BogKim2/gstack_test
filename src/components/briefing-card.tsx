"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Loader2, CheckCircle2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MeetingContext } from "@/components/meeting-context";
import { getSeoulYmd } from "@/lib/korea-time";

interface Delta {
  eventCountChange: number;
  busyScoreChange: number;
}

interface Thread {
  id: string;
  snippet: string;
}

interface Briefing {
  id?: string;
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
  warnings?: string[];
}

interface BriefingCardProps {
  initialBriefing: Briefing | null;
}

function handleNdjsonObject(
  obj: Record<string, unknown>,
  onChunk: (text: string) => void
):
  | { kind: "done"; message?: string; briefing: Briefing | null }
  | { kind: "error"; error: string }
  | { kind: "chunk" }
  | null {
  if (obj.type === "chunk" && typeof obj.text === "string") {
    onChunk(obj.text);
    return { kind: "chunk" };
  }
  if (obj.type === "done") {
    return {
      kind: "done",
      message: typeof obj.message === "string" ? obj.message : undefined,
      briefing: (obj.briefing as Briefing) ?? null,
    };
  }
  if (obj.type === "error") {
    return {
      kind: "error",
      error: typeof obj.message === "string" ? obj.message : "오류",
    };
  }
  return null;
}

async function parseNdjsonStream(
  response: Response,
  onChunk: (text: string) => void
): Promise<{
  message?: string;
  briefing: Briefing | null;
  error?: string;
}> {
  const reader = response.body?.getReader();
  if (!reader) {
    return { briefing: null, error: "스트림을 읽을 수 없습니다" };
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }

      const r = handleNdjsonObject(obj, onChunk);
      if (r?.kind === "done") {
        return { message: r.message, briefing: r.briefing };
      }
      if (r?.kind === "error") {
        return { briefing: null, error: r.error };
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      const obj = JSON.parse(tail) as Record<string, unknown>;
      const r = handleNdjsonObject(obj, onChunk);
      if (r?.kind === "done") {
        return { message: r.message, briefing: r.briefing };
      }
      if (r?.kind === "error") {
        return { briefing: null, error: r.error };
      }
    } catch {
      // 스트림 끝에 불완전한 JSON이 남은 경우
    }
  }

  return { briefing: null, error: "응답이 완료되지 않았습니다" };
}

export function BriefingCard({ initialBriefing }: BriefingCardProps) {
  const [briefing, setBriefing] = useState<Briefing | null>(initialBriefing);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [streamPreview, setStreamPreview] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateBriefing = async () => {
    setLoading(true);
    setStreamPreview("");
    try {
      const response = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: true }),
      });

      const ct = response.headers.get("content-type") || "";

      if (ct.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "브리핑 생성 실패");
        }
        if (data.briefing) {
          setBriefing(data.briefing);
          toast.success("브리핑이 생성되었습니다!");
        } else {
          toast.info(data.message || "오늘 일정이 없습니다");
        }
        return;
      }

      if (!response.ok) {
        throw new Error("브리핑 생성 실패");
      }

      const result = await parseNdjsonStream(response, (text) => {
        setStreamPreview((s) => s + text);
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.briefing) {
        setBriefing(result.briefing);
        setStreamPreview("");
        toast.success(result.message || "브리핑이 생성되었습니다!");
      } else {
        toast.info("오늘 일정이 없습니다");
        setStreamPreview("");
      }
    } catch (error) {
      console.error("Briefing generation error:", error);
      toast.error(error instanceof Error ? error.message : "브리핑 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const emptyDateLabel = () => {
    const ymd = getSeoulYmd();
    return new Date(`${ymd}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  if (!briefing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>오늘의 브리핑</CardTitle>
          <CardDescription>{emptyDateLabel()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-lg w-full">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                아직 생성된 브리핑이 없습니다
              </p>
              {(loading || streamPreview) && (
                <div className="mb-4 rounded-md border bg-muted/40 p-4 text-left text-sm whitespace-pre-wrap min-h-[4rem]">
                  {loading && !streamPreview && (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      생성 중...
                    </span>
                  )}
                  {streamPreview}
                </div>
              )}
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
    if (score >= 80) return "text-red-600 dark:text-red-400";
    if (score >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-emerald-600 dark:text-emerald-400";
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
                    {briefing.delta.busyScoreChange > 0 ? "+" : ""}
                    {briefing.delta.busyScoreChange}
                  </span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {briefing.warnings && briefing.warnings.length > 0 && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>일부 외부 데이터를 가져오지 못했습니다</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 text-sm mt-1 space-y-0.5">
                {briefing.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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
          <div className="rounded-lg border border-chart-2/30 bg-gradient-to-br from-chart-2/10 to-chart-3/10 p-3 text-xs">
            <div className="font-semibold mb-1 text-chart-2">LLM 호출 정보</div>
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
