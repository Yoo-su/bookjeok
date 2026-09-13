import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { PrivacyView } from "@/views/privacy-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tMeta = await getTranslations({
    locale,
    namespace: "privacy_page.metadata",
  });
  return createPageMetadata({
    title: tMeta("title"),
    description: tMeta("description"),
    locale,
    path: "/privacy",
  });
}

// setRequestLocale이 없으면 next-intl이 헤더에서 로케일을 읽어 라우트가 동적으로 떨어진다.
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyView />;
}
