/**
 * 리뷰 목록 필터 링크의 계약 검증.
 *
 * 서버는 예전부터 `GET /reviews?tag=`·`?isbn=`을 지원했지만 웹에는 호출처가
 * 없었다. 태그는 어디서나 클릭되지 않는 <span>이었고(상세 페이지는 hover 밑줄까지
 * 붙어 있어 링크처럼 보이기만 했다), 도서 상세의 "리뷰 더보기"는 `?isbn=`을
 * 달고도 필터가 걸리지 않은 목록으로 갔다. 되돌아가기 쉬운 지점이라 셋을 고정한다.
 * - 태그가 앵커로 나가는가 (크롤러가 따라갈 수 있어야 한다)
 * - href에 값이 인코딩돼 들어가는가
 * - 목록이 그 값을 실제로 조회 파라미터까지 흘려보내는가
 */
import { PopularTagStat } from "@bookjeok/core";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { PopularTagsList } from "@/features/insights/components/lists/popular-tags-list";
import { ReviewGridList } from "@/features/review/components/review-list/review-grid-list";
import { PATHS } from "@/shared/constants/paths";

// aria-label을 값으로 구분해야 해서 보간까지 흉내 낸다.
vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => {
    const t = (key: string, values?: Record<string, unknown>) => {
      const id = `${section ? `${section}.` : ""}${key}`;
      return values ? `${id}:${Object.values(values).join(",")}` : id;
    };
    return t;
  },
}));

// i18n Link는 use-intl 컨텍스트를 직접 읽는다. 여기서 보는 것은 로케일 접두사가
// 아니라 href의 모양이라 평범한 앵커로 바꾼다.
vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// jsdom에는 IntersectionObserver가 없다. 무한 스크롤 트리거는 이 테스트의 관심사가 아니다.
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: false }),
}));

const useReviewsInfiniteQuery = vi.fn();
vi.mock("@bookjeok/react-query", () => ({
  useReviewsInfiniteQuery: (...args: unknown[]) =>
    useReviewsInfiniteQuery(...args),
}));

const emptyResult = {
  data: { pages: [{ reviews: [] }] },
  isLoading: false,
  isError: false,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

describe("목록 필터 경로", () => {
  it("태그를 인코딩해 리뷰 목록의 tag 파라미터로 붙인다", () => {
    expect(PATHS.REVIEWS_BY_TAG("민음사 빵")).toBe(
      "/book/reviews?tag=%EB%AF%BC%EC%9D%8C%EC%82%AC%20%EB%B9%B5",
    );
    // & 같은 구분자가 파라미터를 쪼개지 않아야 한다
    expect(PATHS.REVIEWS_BY_TAG("A&B")).toBe("/book/reviews?tag=A%26B");
  });

  it("ISBN을 리뷰 목록의 isbn 파라미터로 붙인다", () => {
    expect(PATHS.REVIEWS_BY_ISBN("9791167376442")).toBe(
      "/book/reviews?isbn=9791167376442",
    );
  });
});

describe("인기 태그", () => {
  it("배지를 링크로 내보낸다", () => {
    const data: PopularTagStat[] = [
      { name: "민음사빵", count: 12 },
      { name: "노벨문학상", count: 3 },
    ];

    render(<PopularTagsList data={data} />);

    const link = screen.getByRole("link", { name: /민음사빵/ });
    expect(link).toHaveAttribute(
      "href",
      "/book/reviews?tag=%EB%AF%BC%EC%9D%8C%EC%82%AC%EB%B9%B5",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

describe("리뷰 목록", () => {
  it("tag를 조회 파라미터로 전달한다", () => {
    useReviewsInfiniteQuery.mockReturnValue(emptyResult);

    render(
      <ReviewGridList
        searchQuery=""
        category={null}
        tag="민음사빵"
        clearFilters={vi.fn()}
      />,
    );

    expect(useReviewsInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ tag: "민음사빵" }),
    );
  });

  it("isbn을 조회 파라미터로 전달한다", () => {
    useReviewsInfiniteQuery.mockReturnValue(emptyResult);

    render(
      <ReviewGridList
        searchQuery=""
        category={null}
        isbn="9791167376442"
        clearFilters={vi.fn()}
      />,
    );

    expect(useReviewsInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ isbn: "9791167376442" }),
    );
  });

  it("태그만 걸려 있어도 결과 없음을 '검색 결과 없음'으로 다룬다", () => {
    useReviewsInfiniteQuery.mockReturnValue(emptyResult);

    render(
      <ReviewGridList
        searchQuery=""
        category={null}
        tag="없는태그"
        clearFilters={vi.fn()}
      />,
    );

    // 필터가 걸린 빈 목록에서는 "첫 리뷰 작성"이 아니라 "전체 목록 보기"가 나와야 한다
    expect(screen.getByText("review.list.empty_search_title")).toBeDefined();
    expect(screen.getByText("review.list.view_all")).toBeDefined();
  });
});
