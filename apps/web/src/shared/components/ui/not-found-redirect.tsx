"use client";

import { useTranslations } from "next-intl";

import { AlertTriangle, ArrowLeft } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface NotFoundRedirectProps {
  /** 표시할 메시지 */
  message?: string;
  /** 리디렉션 경로 (기본: 홈) */
  fallbackPath?: string;
}

/**
 * 리소스를 찾을 수 없을 때 표시하는 컴포넌트
 * 오류를 읽고 직접 다음 목적지로 이동할 수 있다.
 */
export function NotFoundRedirect({
  message,
  fallbackPath = PATHS.HOME,
}: NotFoundRedirectProps) {
  const t = useTranslations("error_pages.not_found");

  const displayMessage = message || t("default_message");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        {t("subtitle")}
      </h1>
      <p className="text-stone-600 mb-6 max-w-md">{displayMessage}</p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={fallbackPath} replace>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t(fallbackPath === PATHS.HOME ? "btn_home" : "btn_continue")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
