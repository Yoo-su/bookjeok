import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { AdminFeedbackView } from "@/views/admin-feedback-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback.admin" });

  return createPageMetadata({
    title: t("title"),
    description: t("subtitle"),
    locale,
    path: "/admin/feedback",
    noIndex: true,
  });
}

export default function AdminFeedbackPage() {
  return <AdminFeedbackView />;
}
