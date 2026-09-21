"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Logo } from "@/layouts/common/logo";
import { RefreshCw } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { config } from "@/shared/config/env";
import { Link } from "@/shared/config/i18n/routing";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 에러 로깅 서비스에 에러 전송 (예: Sentry)
    console.error("Global Error:", error);
  }, [error]);

  const t = useTranslations("error_pages.general_error");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50/50 px-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -z-10" />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 scale-125">
          <Logo size="md" />
        </div>

        <div className="space-y-6 max-w-md mx-auto p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-stone-200/50">
          <div className="space-y-2">
            <h1 className="text-8xl font-serif font-bold text-stone-900/10 select-none">
              {t("title")}
            </h1>
            <h2 className="text-2xl font-bold text-stone-800">
              {t("subtitle")}
            </h2>
          </div>

          <p
            className="text-stone-600 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: t.raw("description") }}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
            <Button
              onClick={reset}
              className="rounded-full bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("retry_button")}
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-stone-200 hover:bg-white/50 hover:text-stone-900 transition-all"
            >
              <Link href="/">{t("home_button")}</Link>
            </Button>
          </div>
        </div>

        {config.isDev && (
          <div className="mt-8 max-w-md w-full">
            <details className="text-left bg-white/50 backdrop-blur-sm rounded-xl border border-stone-200 p-4">
              <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">
                개발자용 에러 상세 정보
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-stone-900 p-4 text-[10px] text-red-300 leading-relaxed font-mono">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 text-stone-400 text-xs">
        © Bookjeok. All rights reserved.
      </div>
    </div>
  );
}
