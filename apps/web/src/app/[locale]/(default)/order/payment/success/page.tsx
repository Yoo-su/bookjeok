import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale, redirect } from "@/shared/config/i18n/routing";
import { createPageMetadata } from "@/shared/config/metadata";
import { PATHS } from "@/shared/constants/paths";
import { OrderPaymentSuccessView } from "@/views/order-payment-success-view";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "order.payment.success",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("subtitle"),
    locale,
    path: "/order/payment/success",
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED !== "true") {
    redirect({ href: PATHS.HOME, locale });
  }

  setRequestLocale(locale);

  return <OrderPaymentSuccessView />;
}
