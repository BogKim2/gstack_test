import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";

export default async function ConnectGooglePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.googleLinked) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-5/20 via-background to-chart-2/20">
      <header className="border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-2 text-lg font-semibold">Google 연동</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-10">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Google 계정을 연결해 주세요</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              캘린더 일정과 Gmail 맥락을 불러오려면 Google OAuth 권한이 필요합니다.
              카카오·네이버로 로그인하신 경우, 아래 버튼으로 Google을 한 번 연결하면
              브리핑 기능을 사용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>연결 시 캘린더·Gmail 읽기 권한만 요청합니다.</li>
              <li>이미 Google로만 로그인한 경우에는 별도 연동이 없습니다.</li>
            </ul>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                size="lg"
              >
                Google 계정 연결하기
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Link href="/settings" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              설정으로 돌아가기
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
