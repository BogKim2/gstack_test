"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Settings {
  llmProvider: string;
  lmStudioEndpoint: string;
  lmStudioModel: string;
  promptPreset: string;
}

export function SettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    llmProvider: "lmstudio",
    lmStudioEndpoint: "http://192.168.0.2:1234/v1",
    lmStudioModel: "nvidia/nemotron-3-nano-4b",
    promptPreset: "default",
  });

  useEffect(() => {
    // 설정 불러오기
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((error) => {
        console.error("Settings fetch error:", error);
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "설정 저장 실패");
      }

      toast.success("설정이 저장되었습니다!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Settings save error:", error);
      toast.error(error instanceof Error ? error.message : "설정 저장 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>프로바이더 선택</Label>
        <RadioGroup
          value={settings.llmProvider}
          onValueChange={(value) =>
            setSettings({ ...settings, llmProvider: value })
          }
        >
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
          value={settings.lmStudioEndpoint}
          onChange={(e) =>
            setSettings({ ...settings, lmStudioEndpoint: e.target.value })
          }
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
          value={settings.lmStudioModel}
          onChange={(e) =>
            setSettings({ ...settings, lmStudioModel: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground">
          LM Studio에서 로드한 모델 이름
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preset">프롬프트 프리셋</Label>
        <RadioGroup
          value={settings.promptPreset}
          onValueChange={(value) =>
            setSettings({ ...settings, promptPreset: value })
          }
        >
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
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={loading}
        >
          취소
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장"
          )}
        </Button>
      </div>
    </div>
  );
}
