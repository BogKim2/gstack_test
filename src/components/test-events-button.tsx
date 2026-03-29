"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, TestTube2 } from "lucide-react";
import { toast } from "sonner";

export function TestEventsButton() {
  const [loading, setLoading] = useState(false);

  const createTestEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test/create-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: 3 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "테스트 일정 생성 실패");
      }

      toast.success(data.message);
      
      // 페이지 새로고침하여 브리핑 다시 가져오기
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Test events creation error:", error);
      toast.error(
        error instanceof Error ? error.message : "테스트 일정 생성 중 오류가 발생했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={createTestEvents}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          생성 중...
        </>
      ) : (
        <>
          <TestTube2 className="mr-2 h-4 w-4" />
          테스트 일정 추가
        </>
      )}
    </Button>
  );
}
