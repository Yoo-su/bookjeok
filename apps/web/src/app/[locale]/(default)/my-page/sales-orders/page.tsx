import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale, redirect } from "@/shared/config/i18n/routing";
import { createPageMetadata } from "@/shared/config/metadata";
import { PATHS } from "@/shared/constants/paths";
import { MySalesOrdersView } from "@/views/my-sales-orders-view";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "my_page.menu.sales_orders.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/my-page/sales-orders",
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED !== "true") {
    redirect({ href: PATHS.HOME, locale });
  }

  setRequestLocale(locale);

  return <MySalesOrdersView />;
}
