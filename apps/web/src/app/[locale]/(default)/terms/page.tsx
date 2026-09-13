import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { TermsView } from "@/views/terms-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tMeta = await getTranslations({
    locale,
    namespace: "terms_page.metadata",
  });
  return createPageMetadata({
    title: tMeta("title"),
    description: tMeta("description"),
    locale,
    path: "/terms",
  });
}

// setRequestLocale이 없으면 next-intl이 헤더에서 로케일을 읽어 라우트가 동적으로 떨어진다.
// 약관은 바뀌지 않는 문서인데 매 요청 렌더돼 Fluid 실행 시간을 먹고 있었다.
export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsView />;
}
