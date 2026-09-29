"use client";

import { useTranslations } from "next-intl";

import { AdminGuard } from "@/features/auth/components/guards/admin-guard";
import { AdminFeedbackList } from "@/features/feedback/components/admin-feedback-list";

/**
 * 운영자 문의 관리 페이지 View
 * - 권한은 서버가 막는다. 여기서는 ADMIN이 아니면 홈으로 보낼 뿐이다
 */
export const AdminFeedbackView = () => (
  <AdminGuard>
    <AdminFeedbackContent />
  </AdminGuard>
);

const AdminFeedbackContent = () => {
  const t = useTranslations("feedback.admin");

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">
          {t("subtitle")}
        </p>
      </div>
      <AdminFeedbackList />
    </div>
  );
};
