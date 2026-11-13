import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale, redirect } from "@/shared/config/i18n/routing";
import { createPageMetadata } from "@/shared/config/metadata";
import { PATHS } from "@/shared/constants/paths";
import { OrderDetailView } from "@/views/order-detail-view";

type Props = {
  params: Promise<{ locale: Locale; orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, orderId } = await params;
  const t = await getTranslations({ locale, namespace: "order.detail" });

  return createPageMetadata({
    title: t("page_title"),
    description: t("metadata_description", { orderId }),
    locale,
    path: `/order/${orderId}`,
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale, orderId } = await params;
  if (process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED !== "true") {
    redirect({ href: PATHS.HOME, locale });
  }

  setRequestLocale(locale);

  return <OrderDetailView orderId={orderId} />;
}
