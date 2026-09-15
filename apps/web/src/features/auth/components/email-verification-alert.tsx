"use client";

import { useSendVerificationEmailMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { ShieldSecurityIcon } from "@/shared/components/icons";
import {
  CheckCircle2,
  Loader2,
  Mail,
  ShieldAlert,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

interface EmailVerificationAlertProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

/**
 * 이메일 미인증 사용자에게 인증을 유도하는 북적 테마 인라인 알림 배너
 */
export const EmailVerificationAlert: React.FC<EmailVerificationAlertProps> = ({
  title,
  description,
  className = "",
  compact = false,
}) => {
  const t = useTranslations("auth.verification.alert");
  const user = useAuthStore((state) => state.user);
  const [isSent, setIsSent] = useState(false);

  const { mutate: sendEmail, isPending } = useSendVerificationEmailMutation({
    onSuccess: () => {
      setIsSent(true);
      toast.success(t("toast_success"));
    },
    onError: (error) => {
      toast.error(error.message || t("toast_error"));
    },
  });

  if (!user || user.isEmailVerified) {
    return null;
  }

  const alertTitle = title ?? t("title");
  const alertDescription = description ?? t("description");

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border border-stone-200/90 bg-stone-50/80 px-3.5 py-2.5 text-xs text-stone-700 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldSecurityIcon className="h-4 w-4 shrink-0 text-stone-700 dark:text-stone-300" />
          <span className="font-medium truncate">{alertTitle}</span>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending || isSent}
          onClick={() => sendEmail()}
          className="h-7 shrink-0 text-xs rounded-lg font-medium bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-colors cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isSent ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5 mr-1" />
          )}
          {isSent ? t("sent") : t("send")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 sm:p-5 shadow-2xs dark:border-stone-800 dark:bg-stone-900/60 backdrop-blur-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-800 border border-stone-200/70 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700/60">
            <ShieldSecurityIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {alertTitle}
            </h4>
            <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              {alertDescription}
            </p>
            {user.email && (
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono pt-0.5">
                {t("account_label")}:{" "}
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {user.email}
                </span>
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          disabled={isPending || isSent}
          onClick={() => sendEmail()}
          className="shrink-0 h-9 px-4 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-2xs transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              {t("sending")}
            </>
          ) : isSent ? (
            <>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {t("sent_check")}
            </>
          ) : (
            <>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              {t("send")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 인증이 필요한 기능 이름. 번역된 문자열을 넘긴다 */
  actionName?: string;
}

/**
 * 미인증 사용자가 거래 관련 액션(채팅하기, 주문서 작성 등)을 시도할 때 노출되는 북적 테마 다이얼로그 모달
 */
export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  onOpenChange,
  actionName,
}) => {
  const t = useTranslations("auth.verification.alert");
  const tActions = useTranslations("common.actions");
  const user = useAuthStore((state) => state.user);
  const [isSent, setIsSent] = useState(false);

  const { mutate: sendEmail, isPending } = useSendVerificationEmailMutation({
    onSuccess: () => {
      setIsSent(true);
      toast.success(t("toast_success"));
    },
    onError: (error) => {
      toast.error(error.message || t("toast_error"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs">
        <DialogHeader className="space-y-2 text-center sm:text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 border border-stone-200/70 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700/60 mb-1">
            <ShieldSecurityIcon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            {t.rich("modal_desc", {
              action: actionName ?? t("actions.default"),
              b: (chunks) => (
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {chunks}
                </span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3.5 text-xs text-stone-600 dark:text-stone-300 border border-stone-200/70 dark:border-stone-800 space-y-1">
          <p className="font-semibold text-stone-800 dark:text-stone-200">
            {t("modal_account_title")}
          </p>
          <p className="font-mono text-stone-500 dark:text-stone-400">
            {user?.email || t("modal_no_email")}
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs cursor-pointer"
          >
            {tActions("close")}
          </Button>
          <Button
            type="button"
            disabled={isPending || isSent}
            onClick={() => sendEmail()}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-2xs gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("sending")}
              </>
            ) : isSent ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("sent")}
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" />
                {t("send")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
