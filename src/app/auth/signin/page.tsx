import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default async function SignInPage() {
  const showKakao = Boolean(
    process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET
  );
  const showNaver = Boolean(
    process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-chart-5/20 via-background to-chart-2/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
            Daily Briefing
          </CardTitle>
          <CardDescription className="text-base">
            AI가 요약해주는 하루 일정 브리핑
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg border border-chart-2/20 bg-muted/40 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground">
            일정·메일 연동은 <strong className="text-foreground">Google</strong> 권한이 필요합니다.
            <br />
            카카오·네이버로 시작한 뒤, 다음 화면에서 Google을 연결할 수 있습니다.
          </p>

          <div className="flex flex-col gap-3">
            {showKakao && (
              <form
                action={async () => {
                  "use server";
                  await signIn("kakao", { redirectTo: "/settings/connect-google" });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-[#FEE500] bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]"
                  size="lg"
                >
                  카카오로 계속하기
                </Button>
              </form>
            )}

            {showNaver && (
              <form
                action={async () => {
                  "use server";
                  await signIn("naver", { redirectTo: "/settings/connect-google" });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-[#03C75A] bg-[#03C75A] text-white hover:bg-[#02b351]"
                  size="lg"
                >
                  네이버로 계속하기
                </Button>
              </form>
            )}

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">또는</span>
              </div>
            </div>

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
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인 (일정 연동 포함)
              </Button>
            </form>
          </div>

          {!showKakao && !showNaver && (
            <p className="text-center text-[11px] text-muted-foreground">
              카카오·네이버 로그인을 쓰려면 <code className="rounded bg-muted px-1">.env</code>에
              KAKAO_* / NAVER_* 키를 설정하세요.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
