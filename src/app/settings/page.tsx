import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-bold">설정</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>LLM 프로바이더 설정</CardTitle>
            <CardDescription>
              브리핑 생성에 사용할 AI 모델을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>프로바이더 선택</Label>
              <RadioGroup defaultValue="lmstudio">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="openai" id="openai" />
                  <Label htmlFor="openai" className="font-normal">
                    OpenAI (GPT-4o-mini)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lmstudio" id="lmstudio" />
                  <Label htmlFor="lmstudio" className="font-normal">
                    LM Studio (로컬 LLM)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">LM Studio 엔드포인트</Label>
              <Input
                id="endpoint"
                type="url"
                placeholder="http://192.168.0.2:1234/v1"
                defaultValue="http://192.168.0.2:1234/v1"
              />
              <p className="text-xs text-muted-foreground">
                LM Studio 서버의 API 엔드포인트 주소
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">모델 이름</Label>
              <Input
                id="model"
                type="text"
                placeholder="nvidia/nemotron-3-nano-4b"
                defaultValue="nvidia/nemotron-3-nano-4b"
              />
              <p className="text-xs text-muted-foreground">
                LM Studio에서 로드한 모델 이름
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset">프롬프트 프리셋</Label>
              <RadioGroup defaultValue="default">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default" className="font-normal">
                    기본 (간결한 요약)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <Label htmlFor="detailed" className="font-normal">
                    상세 (자세한 설명 포함)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="action" id="action" />
                  <Label htmlFor="action" className="font-normal">
                    액션 중심 (실행 항목 강조)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard">
                <Button variant="outline">취소</Button>
              </Link>
              <Button>저장</Button>
            </div>
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
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
