import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import messages from "@/shared/i18n/messages/ko.json";

import { READING_LOG_FAQ, ReadingLogIntroView } from "./index";

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

// 예시 달력은 브라우저에서만 움직인다. 글과 링크만 본다
vi.mock(
  "@/features/reading-log/components/calendar-view/reading-log-demo",
  () => ({ ReadingLogDemo: () => <div data-testid="demo" /> }),
);

const renderView = () =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ReadingLogIntroView />
    </NextIntlClientProvider>,
  );

describe("ReadingLogIntroView", () => {
  beforeEach(() => useReadingLogViewStore.setState({ viewMode: "stack" }));

  it("검색엔진이 읽을 소개 글과 질문을 모두 그린다", () => {
    renderView();
    expect(
      screen.getByRole("heading", { level: 1, name: "독서 기록" }),
    ).toBeInTheDocument();
    for (const key of READING_LOG_FAQ)
      expect(
        screen.getByText(messages.reading_log_page.faq[key].q),
      ).toBeInTheDocument();
    // {max} 자리가 그대로 새지 않는다
    expect(document.body.textContent).not.toContain("{max}");
  });

  it("시작 버튼은 독서 기록을 달력 보기로 연다", () => {
    renderView();
    const [cta] = screen.getAllByRole("link", {
      name: "내 독서 기록 시작하기",
    });
    expect(cta).toHaveAttribute("href", "/my-page/reading-log");
    fireEvent.click(cta);
    expect(useReadingLogViewStore.getState().viewMode).toBe("calendar");
  });

  it("독서 키재기 소개로 잇는다", () => {
    renderView();
    expect(
      screen.getByRole("link", { name: /독서 키재기 알아보기/ }),
    ).toHaveAttribute("href", "/reading-height");
  });
});
