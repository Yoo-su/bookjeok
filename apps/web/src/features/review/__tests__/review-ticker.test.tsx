/**
 * 최신 리뷰 티커의 레이아웃 계약 검증.
 *
 * 전환 자체(모션 완료 콜백)는 jsdom에서 재현이 불안정해 브라우저로 확인하고,
 * 여기서는 되돌아오기 쉬운 두 가지만 고정한다.
 * - 뷰포트 높이를 5줄로 잠그는가 (안 잠그면 회전할 때마다 아래 광고·푸터가 들썩인다)
 * - "동작 줄이기"에서 회전을 아예 끄는가
 */
import { Review } from "@bookjeok/core";
import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewTicker } from "@/features/review/components/recent-review-list/review-ticker";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));
// i18n Link는 use-intl 컨텍스트를 직접 읽는다. 여기서 보는 것은 링크가 아니라
// 잘라내기·줄 수라 평범한 앵커로 바꾼다
vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => <a href={href}>{children}</a>,
}));

const ROW_HEIGHT = 120;
const VISIBLE_COUNT = 5;

const makeReviews = (count: number): Review[] =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        id: i + 1,
        title: `리뷰 ${i + 1}`,
        content: "<p>본문</p>",
        isbn: `978000000000${i}`,
        rating: 4,
        tags: [],
        viewCount: 0,
        userId: i + 1,
        isPublic: true,
        user: { id: i + 1, handle: `u${i}`, nickname: `독자${i}` },
        book: { isbn: `978000000000${i}`, title: "책", author: "저자" },
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      }) as unknown as Review,
  );

/** jsdom은 레이아웃을 계산하지 않아 offsetHeight가 항상 0이다 */
const stubRowHeight = (height: number) =>
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => height,
  });

const setReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduce,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
};

/** 높이가 잠긴 뷰포트 = 인라인 height가 붙은 요소 */
const findLockedViewport = (container: HTMLElement) =>
  [...container.querySelectorAll("div")].find((node) => node.style.height);

describe("ReviewTicker", () => {
  beforeEach(() => {
    stubRowHeight(ROW_HEIGHT);
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("보이는 줄보다 하나 더 그리고 뷰포트를 5줄 높이로 잠근다", () => {
    const { container } = render(<ReviewTicker reviews={makeReviews(20)} />);

    const viewport = findLockedViewport(container);
    expect(viewport?.style.height).toBe(`${ROW_HEIGHT * VISIBLE_COUNT}px`);
    expect(viewport).toHaveClass("overflow-hidden");
    // 마지막 한 줄이 아래에서 올라오는 줄이라 잘려 있어야 한다
    expect(container.querySelectorAll("a")).toHaveLength(VISIBLE_COUNT + 1);
  });

  it("보이는 줄 수 이하면 잘라내지 않고 그대로 둔다", () => {
    const { container } = render(<ReviewTicker reviews={makeReviews(4)} />);

    expect(findLockedViewport(container)).toBeUndefined();
    expect(container.querySelectorAll("a")).toHaveLength(4);
  });

  it("동작 줄이기에서는 회전하지 않고 상위 5건만 그린다", () => {
    setReducedMotion(true);

    const { container } = render(<ReviewTicker reviews={makeReviews(20)} />);

    expect(findLockedViewport(container)).toBeUndefined();
    expect(container.querySelectorAll("a")).toHaveLength(VISIBLE_COUNT);
  });
});
