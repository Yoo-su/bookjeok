"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/shared/components/shadcn/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 에러 로깅 서비스에 에러 전송 (예: Sentry)
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">😵</h1>
        <h2 className="mb-2 text-2xl font-semibold text-gray-800">
          문제가 발생했습니다
        </h2>
        <p className="mb-6 text-gray-600">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            홈으로 이동
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              에러 상세 정보 (개발 모드)
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-red-400">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
