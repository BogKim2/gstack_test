"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";

interface WeekEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description: string;
  attendees: number;
}

interface WeekStats {
  totalEvents: number;
  totalDays: number;
  busiestDay: {
    date: string;
    count: number;
  };
}

export function WeekTimeline() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, WeekEvent[]>>({});
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWeekEvents = async (offset: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/briefing/week?weekOffset=${offset}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || {});
        setStats(data.stats || null);
        setWeekStart(data.weekStart || "");
        setWeekEnd(data.weekEnd || "");
      }
    } catch (error) {
      console.error("Failed to load week events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeekEvents(weekOffset);
  }, [weekOffset]);

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00+09:00");
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const getWeekDays = () => {
    if (!weekStart) return [];
    
    const days = [];
    const start = new Date(weekStart + "T00:00:00+09:00");
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];
      days.push(dateStr);
    }
    
    return days;
  };

  const weekDays = getWeekDays();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>주간 타임라인</CardTitle>
            <CardDescription>
              {weekStart && weekEnd && (
                <>
                  {new Date(weekStart + "T00:00:00+09:00").toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(weekEnd + "T00:00:00+09:00").toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                  })}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              이번 주
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats && stats.totalEvents > 0 ? (
          <div className="space-y-4">
            {/* 주간 통계 */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/50 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-xs text-muted-foreground">총 일정</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalDays}</div>
                <div className="text-xs text-muted-foreground">일정 있는 날</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.busiestDay.count}</div>
                <div className="text-xs text-muted-foreground">
                  최다 일정 ({getDayLabel(stats.busiestDay.date)})
                </div>
              </div>
            </div>

            {/* Gantt 차트 스타일 타임라인 */}
            <div className="space-y-2">
              {weekDays.map((dateStr) => {
                const dayEvents = events[dateStr] || [];
                const isToday = dateStr === new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split("T")[0];
                
                return (
                  <div
                    key={dateStr}
                    className={`rounded-lg border p-3 ${
                      isToday ? "border-primary bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                          {getDayLabel(dateStr)}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            오늘
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dayEvents.length}개 일정
                      </span>
                    </div>
                    
                    {dayEvents.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-md border bg-background p-2 text-xs"
                          >
                            <div className="font-medium">{event.summary}</div>
                            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                              <span>
                                {formatTime(event.start)} - {formatTime(event.end)}
                              </span>
                              {event.attendees > 0 && (
                                <span>· {event.attendees}명</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">일정 없음</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">이번 주 일정이 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
