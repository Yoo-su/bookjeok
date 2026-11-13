"use client";

import { useVerifyEmailMutation } from "@bookjeok/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Logo } from "@/layouts/common/logo";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const VerifyEmailView = () => {
  const t = useTranslations("auth.verification");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const verifiedRef = useRef(false);

  const { mutate: verify } = useVerifyEmailMutation({
    onSuccess: (data) => {
      setStatus("success");
      // 현재 로그인된 사용자의 인증 상태 실시간 업데이트
      if (user) {
        setUser({
          ...user,
          isEmailVerified: true,
        });
      }
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(t("error_desc"));
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("error_desc"));
      return;
    }

    if (!verifiedRef.current) {
      verifiedRef.current = true;
      verify(token);
    }
  }, [token, verify, t]);

  return (
    <div className="flex min-h-[60vh] sm:min-h-[70vh] items-center justify-center py-6 sm:py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Loader2 className="h-7 w-7 animate-spin text-stone-600 dark:text-stone-300" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t("title")}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 break-keep">
              {t("verifying")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t("success_title")}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed break-keep">
              {t("success_desc")}
            </p>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <Button
                asChild
                className="w-full bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-xl h-11 text-sm font-medium transition-colors"
              >
                <Link href={PATHS.MY_PAGE} replace>
                  {t("btn_mypage")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl h-11 text-sm font-medium transition-colors"
              >
                <Link href={PATHS.HOME} replace>
                  {t("btn_home")}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t("error_title")}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed break-keep">
              {errorMessage || t("error_desc")}
            </p>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <Button
                asChild
                className="w-full bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-xl h-11 text-sm font-medium transition-colors"
              >
                <Link href={PATHS.LOGIN} replace>
                  {t("btn_login")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl h-11 text-sm font-medium transition-colors"
              >
                <Link href={PATHS.HOME} replace>
                  {t("btn_home")}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
