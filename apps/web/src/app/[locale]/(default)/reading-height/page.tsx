import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { JsonLd } from "@/shared/components/json-ld";
import { createPageMetadata } from "@/shared/config/metadata";
import { PATHS } from "@/shared/constants/paths";
import {
  READING_HEIGHT_FAQ,
  ReadingHeightView,
} from "@/views/reading-height-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "reading_height_page.metadata",
  });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: PATHS.READING_HEIGHT,
  });
}

// 바뀌지 않는 소개 글이라 정적으로 둔다. setRequestLocale이 없으면 매 요청 렌더된다
export default async function ReadingHeightPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "reading_height_page" });

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: READING_HEIGHT_FAQ.map((key) => ({
      "@type": "Question",
      name: t(`faq.${key}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.${key}.a`) },
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
          {
            name: t("breadcrumb"),
            url: `/${locale}${PATHS.READING_HEIGHT}`,
          },
        ]}
      />
      <JsonLd data={faq} />
      <ReadingHeightView />
    </>
  );
}
