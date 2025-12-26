"use client";

import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

interface NotFoundRedirectProps {
  /** 표시할 메시지 */
  message?: string;
  /** 리디렉션 경로 (기본: 홈) */
  fallbackPath?: string;
  /** 리디렉션 딜레이 (ms, 기본: 3000) */
  delay?: number;
  /** 이전 페이지로 돌아가기 시도 여부 */
  useBack?: boolean;
}

/**
 * 리소스를 찾을 수 없을 때 표시하는 컴포넌트
 * - 에러 메시지 표시 후 자동 리디렉션
 * - 수동 이동 버튼 제공
 */
export function NotFoundRedirect({
  message = "요청하신 페이지를 찾을 수 없습니다.",
  fallbackPath = PATHS.HOME,
  delay = 3000,
  useBack = false,
}: NotFoundRedirectProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000));

  useEffect(() => {
    // 카운트다운
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 리디렉션
    const redirectTimeout = setTimeout(() => {
      if (useBack) {
        router.back();
      } else {
        router.push(fallbackPath);
      }
    }, delay);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimeout);
    };
  }, [delay, fallbackPath, router, useBack]);

  const handleManualRedirect = () => {
    if (useBack) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-stone-600 mb-6 max-w-md">{message}</p>
      <p className="text-sm text-stone-400 mb-8">
        {countdown}초 후 자동으로 이동합니다...
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleManualRedirect}>
          {useBack ? (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지
            </>
          ) : (
            <>
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
