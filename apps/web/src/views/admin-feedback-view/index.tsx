"use client";

import { useTranslations } from "next-intl";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { AdminFeedbackList } from "@/features/feedback/components/admin-feedback-list";

/**
 * 운영자 문의 관리 페이지 View
 * - 권한은 서버가 막는다. 여기서는 ADMIN이 아니면 목록을 부르지 않을 뿐이다
 */
export const AdminFeedbackView = () => (
  <AuthGuard>
    <AdminFeedbackContent />
  </AuthGuard>
);

const AdminFeedbackContent = () => {
  const t = useTranslations("feedback.admin");
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");

  if (!isAdmin) {
    return (
      <p className="py-24 text-center text-sm text-stone-500">
        {t("forbidden")}
      </p>
    );
  }

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
