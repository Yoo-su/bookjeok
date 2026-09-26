import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import messages from "@/shared/i18n/messages/ko.json";

import { READING_HEIGHT_FAQ, ReadingHeightView } from "./index";

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// 무대는 ResizeObserver와 SVG 측정이 필요하다. 글과 링크만 본다
vi.mock(
  "@/features/reading-log/components/stack-view/stack-compare-stage",
  () => ({ StackCompareStage: () => <div data-testid="stage" /> }),
);

describe("ReadingHeightView", () => {
  beforeEach(() => useReadingLogViewStore.setState({ viewMode: "calendar" }));

  it("검색엔진이 읽을 소개 글과 질문을 모두 그린다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <ReadingHeightView />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "독서 키재기" }),
    ).toBeInTheDocument();
    for (const key of READING_HEIGHT_FAQ)
      expect(
        screen.getByText(messages.reading_height_page.faq[key].q),
      ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("탑");
  });

  it("시작 버튼은 독서 기록을 독서 키재기 보기로 연다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <ReadingHeightView />
      </NextIntlClientProvider>,
    );
    const [cta] = screen.getAllByRole("link", {
      name: "내 독서 키재기 해 보기",
    });
    expect(cta).toHaveAttribute("href", "/my-page/reading-log");
    fireEvent.click(cta);
    expect(useReadingLogViewStore.getState().viewMode).toBe("stack");
  });
});
