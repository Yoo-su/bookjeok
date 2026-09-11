"use client";

import { useEffect } from "react";

import { Home, RefreshCw } from "@/shared/components/icons/iconsax";
import { config } from "@/shared/config/env";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root Global Error Boundary
 * 루트 레이아웃(app/[locale]/layout.tsx) 레벨의 크래시 발생 시
 * 흰 화면을 방지하고 복구 액션을 제공하는 Next.js 공식 최상위 에러 바운더리입니다.
 *
 * 주의: 루트 레이아웃 바깥에서 렌더링되므로 Logo, Link 등
 * providers 의존 컴포넌트를 사용할 수 없습니다.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Root Global Error]:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen bg-stone-50/50 text-stone-900 antialiased flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* 배경 장식 요소 — error.tsx 패턴과 동일 */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-100/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -z-10" />

        <main className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          {/* 로고 — Logo 컴포넌트는 providers 의존이라 img로 직접 렌더링 */}
          <div className="mb-8 scale-125">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 루트 레이아웃 밖이라 next/link 사용 불가 */}
            <a href="/" className="inline-flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- 루트 레이아웃 밖이라 next/image 사용 불가 */}
              <img
                src="/logo-square-sketch.svg"
                alt="Bookjeok"
                width={30}
                height={30}
                className="object-contain"
              />
            </a>
          </div>

          {/* 에러 카드 — glassmorphism 패턴 (error.tsx / not-found.tsx 동일) */}
          <div className="space-y-6 max-w-md mx-auto p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-stone-200/50">
            <div className="space-y-2">
              <h1 className="text-8xl font-serif font-bold text-stone-900/10 select-none">
                !
              </h1>
              <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
                일시적인 오류가 발생했습니다
              </h2>
            </div>

            <p className="text-stone-600 leading-relaxed text-sm">
              페이지를 불러오는 도중 예기치 못한 문제가 발생했습니다.
              <br className="hidden sm:inline" /> 아래 버튼을 눌러 다시
              시도해주세요.
            </p>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도하기
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-stone-200 hover:bg-white/50 hover:text-stone-900 text-stone-700 text-sm font-medium transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                홈으로 이동
              </button>
            </div>
          </div>

          {/* 개발자용 디버그 스택 (Dev 환경) */}
          {config.isDev && (
            <div className="mt-8 max-w-md w-full">
              <details className="text-left bg-white/50 backdrop-blur-sm rounded-xl border border-stone-200 p-4">
                <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">
                  개발자용 에러 상세 정보
                </summary>
                <div className="mt-2 overflow-auto rounded-lg bg-stone-900 p-4 text-[10px] text-red-300 leading-relaxed font-mono whitespace-pre-wrap">
                  <p className="font-bold text-red-400">
                    {error.name}: {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-stone-400 mt-1">
                      Digest: {error.digest}
                    </p>
                  )}
                  {error.stack && (
                    <p className="text-stone-500 mt-2 text-[10px]">
                      {error.stack}
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}
        </main>

        <div className="absolute bottom-8 text-stone-400 text-xs">
          © Bookjeok. All rights reserved.
        </div>
      </body>
    </html>
  );
}
