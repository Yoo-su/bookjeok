import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PopularKeywords } from "./index";

const fixture = vi.hoisted(() => ({
  keywords: [
    { keyword: "데미안", searchCount: 10 },
    { keyword: "한강", searchCount: 9 },
    { keyword: "독서", searchCount: 8 },
    { keyword: "소설", searchCount: 7 },
  ],
}));
vi.mock("@bookjeok/react-query", () => ({
  usePopularKeywordsQuery: () => ({ data: fixture.keywords, isLoading: false }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/shared/config/i18n/routing", () => ({
  usePathname: () => "/ko/book/search",
}));

beforeEach(() => window.history.replaceState(null, "", "/ko/book/search"));
afterEach(cleanup);

describe("히어로 인기검색어", () => {
  it("상위 3개만 표시하고 선택한 검색어를 URL에 반영한다", () => {
    render(<PopularKeywords variant="hero" />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByText("소설")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "데미안" }));
    expect(new URLSearchParams(window.location.search).get("q")).toBe("데미안");
  });

  it("데이터가 없으면 임의의 검색어를 표시하지 않는다", () => {
    const original = fixture.keywords;
    fixture.keywords = [];
    const { container } = render(<PopularKeywords variant="hero" />);
    expect(container).toBeEmptyDOMElement();
    fixture.keywords = original;
  });
});
