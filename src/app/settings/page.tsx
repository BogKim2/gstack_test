import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CircleHelp } from "lucide-react";
import Link from "next/link";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link
            href={session.googleLinked ? "/dashboard" : "/settings/connect-google"}
          >
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-4 flex-1 text-xl font-bold">설정</h1>
          <Link href="/help/summary">
            <Button variant="ghost" size="icon" aria-label="도움말">
              <CircleHelp className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        {!session.googleLinked && (
          <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle>Google 연동</CardTitle>
              <CardDescription>
                캘린더·Gmail 브리핑을 쓰려면 Google 계정을 한 번 연결해야 합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/settings/connect-google">Google 연결하기</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>LLM 프로바이더 설정</CardTitle>
            <CardDescription>
              브리핑 생성에 사용할 AI 모델을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>이름</Label>
              <p className="text-sm text-muted-foreground">{session.user.name}</p>
            </div>
            <div>
              <Label>이메일</Label>
              <p className="text-sm text-muted-foreground">
                {session.user.email ?? "— (카카오/네이버에서 동의하지 않은 경우 비어 있을 수 있음)"}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
