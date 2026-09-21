import { useLocale, useTranslations } from "next-intl";

import { PrivacyEn } from "./privacy-en";
import { PrivacyKo } from "./privacy-ko";

export const PrivacyView = () => {
  const t = useTranslations("privacy_page");
  const locale = useLocale();

  return (
    <div className="min-h-dvh bg-stone-50 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {t("title")}
          </h1>
        </header>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-10">
          <div className="text-stone-600 leading-relaxed space-y-8">
            {locale === "en" ? <PrivacyEn /> : <PrivacyKo />}
          </div>
        </div>
      </div>
    </div>
  );
};
