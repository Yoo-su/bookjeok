"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { useConfirm } from "@/features/confirm";
import { useRouter } from "@/shared/config/i18n/routing";
import { returnToApp } from "@/shared/utils/browser-navigation";

export function useFormCancel(
  dirty: boolean,
  fallback: string,
  allowedPreviousPaths: readonly string[] = [fallback],
) {
  const t = useTranslations("common.unsaved_changes");
  const confirm = useConfirm();
  const router = useRouter();
  const leaving = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return async () => {
    if (leaving.current) return;
    leaving.current = true;
    if (
      dirty &&
      !(await confirm({
        title: t("title"),
        description: t("description"),
        confirmText: t("confirm"),
        cancelText: t("cancel"),
        variant: "destructive",
      }))
    ) {
      leaving.current = false;
      return;
    }
    returnToApp(router, fallback, allowedPreviousPaths);
  };
}
