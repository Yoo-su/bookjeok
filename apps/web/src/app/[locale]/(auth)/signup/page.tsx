import { getTranslations, setRequestLocale } from "next-intl/server";

import { GuestGuard } from "@/features/auth/components/guards/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { createPageMetadata } from "@/shared/config/metadata";
import { SignupView } from "@/views/signup-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.signup.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/signup",
    noIndex: true,
  });
}

// setRequestLocale이 없으면 라우트가 동적으로 떨어져 봇이 칠 때마다 함수가 깨어난다.
export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <GuestGuard>
      <DefaultLayout>
        <SignupView />
      </DefaultLayout>
    </GuestGuard>
  );
}
