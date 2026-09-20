"use client";

import { NextIntlClientProvider, useLocale } from "next-intl";
import { ReactNode } from "react";

import type { Locale } from "@/shared/config/i18n/routing";
import en from "@/shared/i18n/messages/en.json";
import ko from "@/shared/i18n/messages/ko.json";

const messages = { en, ko };

/** 사전은 공용 정적 JS에 두어 ISBN마다 HTML/RSC에 중복 직렬화하지 않는다. */
export function IntlMessagesProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as Locale;

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
