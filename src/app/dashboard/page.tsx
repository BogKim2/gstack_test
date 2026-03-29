import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { BriefingCard } from "@/components/briefing-card";
import { TestEventsButton } from "@/components/test-events-button";
import { db } from "@/db";
import { briefings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 오늘 브리핑 가져오기
  const today = new Date().toISOString().split("T")[0];
  const todayBriefing = await db
    .select()
    .from(briefings)
    .where(
      and(
        eq(briefings.userId, session.user.email!),
        eq(briefings.date, today)
      )
    )
    .orderBy(desc(briefings.createdAt))
    .limit(1);

  const briefingData = todayBriefing[0]
    ? {
        id: todayBriefing[0].id,
        date: todayBriefing[0].date,
        summary: todayBriefing[0].summary,
        actionItems: todayBriefing[0].actionItems
          ? JSON.parse(todayBriefing[0].actionItems)
          : [],
        busyScore: todayBriefing[0].busyScore || 0,
        createdAt: todayBriefing[0].createdAt || Date.now(),
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Daily Briefing</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/signin" });
              }}
            >
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">안녕하세요, {session.user.name}님</h2>
            <p className="text-muted-foreground">오늘의 일정을 확인하세요</p>
          </div>
          <TestEventsButton />
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">오늘</TabsTrigger>
            <TabsTrigger value="week">주간</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <BriefingCard initialBriefing={briefingData} />
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>주간 일정</CardTitle>
                <CardDescription>이번 주 일정 요약</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">주간 뷰는 곧 제공됩니다</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
