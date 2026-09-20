import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "@/shared/i18n/messages/en.json";
import ko from "@/shared/i18n/messages/ko.json";

import { IntlMessagesProvider } from "./intl-messages-provider";

function Content() {
  const t = useTranslations("common");
  return <span>{t("anonymous")}</span>;
}

describe("정적 번역 사전", () => {
  it("서버가 메시지를 전달하지 않아도 번역하며 언어 전환을 반영한다", () => {
    const tree = (locale: string) => (
      <NextIntlClientProvider locale={locale} messages={null} timeZone="UTC">
        <IntlMessagesProvider>
          <Content />
        </IntlMessagesProvider>
      </NextIntlClientProvider>
    );
    const { rerender } = render(tree("ko"));
    expect(screen.getByText(ko.common.anonymous)).toBeInTheDocument();
    rerender(tree("en"));
    expect(screen.getByText(en.common.anonymous)).toBeInTheDocument();
  });
});
