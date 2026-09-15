import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { describe, expect, it } from "vitest";

import enMessages from "@/shared/i18n/messages/en.json";
import koMessages from "@/shared/i18n/messages/ko.json";

import { PriceDisplay } from "../price-display";

const renderPrice = (locale: "ko" | "en", ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ko" ? koMessages : enMessages}
    >
      {ui}
    </NextIntlClientProvider>,
  );

describe("PriceDisplay", () => {
  it("한국어는 단위가 숫자 뒤에 붙는다", () => {
    const { container } = renderPrice("ko", <PriceDisplay value={4500} />);

    expect(container.textContent).toBe("4,500원");
  });

  it("영어는 기호가 숫자 앞에 붙는다", () => {
    const { container } = renderPrice("en", <PriceDisplay value={4500} />);

    expect(container.textContent).toBe("₩4,500");
  });

  it("단위 클래스는 로케일과 무관하게 적용된다", () => {
    const ko = renderPrice(
      "ko",
      <PriceDisplay value={14000} unitClassName="unit-style" />,
    );
    const en = renderPrice(
      "en",
      <PriceDisplay value={14000} unitClassName="unit-style" />,
    );

    expect(ko.container.querySelector(".unit-style")?.textContent).toBe("원");
    expect(en.container.querySelector(".unit-style")?.textContent).toBe("₩");
  });

  it("KRW가 아니면 통화 코드를 뒤에 붙인다", () => {
    const { container } = renderPrice(
      "en",
      <PriceDisplay value={20} currency="USD" />,
    );

    expect(container.textContent).toBe("20USD");
  });
});
