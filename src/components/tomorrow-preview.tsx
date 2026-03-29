"use client";

import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Calendar, Users, Loader2 } from "lucide-react";

interface TomorrowEvent {
  summary: string;
  start: string;
  end: string;
  attendees: number;
}

export function TomorrowPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<TomorrowEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  const loadTomorrowEvents = async () => {
    if (loaded) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/briefing/tomorrow");
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
        setTotalCount(data.totalCount || 0);
        setDateLabel(data.dateLabel ?? null);
        setLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load tomorrow events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !loaded) {
      loadTomorrowEvents();
    }
  }, [isOpen, loaded]);

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-chart-5/30 bg-gradient-to-br from-chart-5/10 to-chart-4/10">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col items-start gap-0.5 text-left">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-chart-5" />
                <CardTitle className="text-base">내일 일정 미리보기</CardTitle>
              </div>
              {dateLabel && (
                <CardDescription className="pl-7 text-xs">
                  서울 기준{" "}
                  {new Date(`${dateLabel}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </CardDescription>
              )}
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {dateLabel
                  ? "이 날짜에는 캘린더 일정이 없습니다"
                  : "내일 일정이 없습니다"}
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-l-4 border-l-chart-5 bg-background p-3 text-sm shadow-sm"
                  >
                    <div className="font-medium">{event.summary}</div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </span>
                      {event.attendees > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees}명
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {totalCount > events.length && (
                  <p className="pt-2 text-center text-xs text-muted-foreground">
                    외 {totalCount - events.length}개 일정 더 있음
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
