import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookInfo } from "../components/book-detail/book-info";

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  return createIntlMock();
});

// 로케일 접두사만 붙이는 래퍼라 href 인코딩은 next/link가 한다
vi.mock("@/shared/config/i18n/routing", async () => ({
  Link: (await import("next/link")).default,
}));

describe("BookInfo 검색 링크", () => {
  it("저자·출판사 이름의 &·+·#를 인코딩해 검색어가 잘리지 않는다", () => {
    render(
      <BookInfo
        title="C++ 입문"
        author="A&B"
        publisher="C++ #출판"
        price={10000}
      />,
    );

    const author = new URL(
      screen.getByRole("link", { name: "A&B" }).getAttribute("href")!,
      "https://bookjeok.com",
    );
    const publisher = new URL(
      screen.getByRole("link", { name: "C++ #출판" }).getAttribute("href")!,
      "https://bookjeok.com",
    );

    expect(author.pathname).toBe("/book/search");
    expect(author.searchParams.get("q")).toBe("A&B");
    expect(publisher.searchParams.get("q")).toBe("C++ #출판");
  });
});
