import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { ReviewListLink } from "./review-list-link";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({
    children,
    href,
    onNavigate,
  }: {
    children: ReactNode;
    href: string;
    onNavigate: (event: { preventDefault: () => void }) => void;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(event);
      }}
    >
      {children}
    </a>
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "navigation");
});

it("필터가 담긴 리뷰를 새 탭에서 열어도 해당 목록으로 복귀할 수 있다", () => {
  window.history.replaceState(
    null,
    "",
    "/ko/book/reviews/81?from=category%3D%25EC%2586%258C%25EC%2584%25A4",
  );
  render(<ReviewListLink>목록으로 돌아가기</ReviewListLink>);
  const link = screen.getByRole("link");
  const target = new URL((link as HTMLAnchorElement).href);
  expect(target.pathname).toBe("/book/reviews");
  expect(target.searchParams.get("category")).toBe("소설");
});

it("리뷰 목차를 눌렀어도 목록 버튼은 실제 이전 목록으로 돌아간다", () => {
  window.history.replaceState(null, "", "/ko/book/reviews/81#review-section-2");
  const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
  const { origin } = window.location;
  Object.defineProperty(window, "navigation", {
    configurable: true,
    value: {
      currentEntry: { index: 2 },
      entries: () => [
        { url: origin + "/ko/book/reviews?category=fiction" },
        { url: origin + "/ko/book/reviews/81" },
        { url: window.location.href },
      ],
    },
  });
  render(<ReviewListLink>목록으로 돌아가기</ReviewListLink>);
  fireEvent.click(screen.getByRole("link"));
  expect(go).toHaveBeenCalledWith(-2);
});
