import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { MyFeedbackView } from "@/views/my-feedback-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback.my" });

  return createPageMetadata({
    title: t("title"),
    description: t("subtitle"),
    locale,
    path: "/my-page/feedback",
    noIndex: true,
  });
}

export default function MyFeedbackPage() {
  return <MyFeedbackView />;
}
