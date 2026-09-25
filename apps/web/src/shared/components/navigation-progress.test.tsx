import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { signalNavigationStart } from "@/shared/utils/navigation-progress";

import { NavigationProgress } from "./navigation-progress";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ko/book/search",
}));

describe("NavigationProgress", () => {
  it("Next Link가 기본 클릭 동작을 막아도 이동 진행 상태를 표시한다", () => {
    const destination = "/ko/book/9781234567890/detail";
    const { container } = render(
      <>
        <NavigationProgress />
        <a href={destination} onClick={(event) => event.preventDefault()}>
          책 상세
        </a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "책 상세" }));

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("앵커가 없는 카드의 router.push 직전 신호에도 표시한다", () => {
    const { container } = render(<NavigationProgress />);

    act(() => signalNavigationStart());

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("Swiper가 드래그 클릭을 취소한 경우 표시하지 않는다", () => {
    const destination = "/ko/book/reviews/123";
    const { container } = render(
      <>
        <NavigationProgress />
        <div className="swiper">
          <a href={destination} onClick={(event) => event.preventDefault()}>
            리뷰 카드
          </a>
        </div>
      </>,
    );
    const swiper = container.querySelector<
      HTMLElement & { swiper?: { allowClick: boolean } }
    >(".swiper");
    swiper!.swiper = { allowClick: false };

    fireEvent.click(screen.getByRole("link", { name: "리뷰 카드" }));

    expect(
      container.querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();

    swiper!.swiper.allowClick = true;
    fireEvent.click(screen.getByRole("link", { name: "리뷰 카드" }));
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("쿼리만 바뀌는 이동도 URL이 바뀌면 종료한다", () => {
    const originalUrl = window.location.href;
    vi.useFakeTimers();
    try {
      window.history.replaceState(null, "", "/ko/book/search");
      const { container } = render(
        <>
          <NavigationProgress />
          <a href="?tag=novel" onClick={(event) => event.preventDefault()}>
            필터
          </a>
        </>,
      );

      fireEvent.click(screen.getByRole("link", { name: "필터" }));
      expect(
        container.querySelector('[aria-hidden="true"]'),
      ).toBeInTheDocument();

      act(() => {
        window.history.pushState(null, "", "?tag=novel");
        vi.advanceTimersByTime(120);
        vi.advanceTimersByTime(220);
      });

      expect(
        container.querySelector('[aria-hidden="true"]'),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      window.history.replaceState(null, "", originalUrl);
    }
  });
});
