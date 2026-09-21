"use client";

import { FormEvent, useEffect, useState } from "react";

import { PopularReviewList } from "@/features/review/components/review-list/popular-review-list";
import { ReviewFeedList } from "@/features/review/components/review-list/review-feed-list";
import { ReviewGridList } from "@/features/review/components/review-list/review-grid-list";
import { ReviewHomeFilters } from "@/features/review/components/review-list/review-home-filters";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface ReviewHomeViewProps {
  /** URL의 category 파라미터. 필터가 걸리지 않았으면 null */
  category: string | null;
  /** URL의 tag 파라미터. 필터가 걸리지 않았으면 null */
  tag: string | null;
  /** URL의 isbn 파라미터. 도서 상세에서 넘어온 경우가 아니면 null */
  isbn: string | null;
  /** URL의 search 파라미터. 없으면 빈 문자열 */
  searchQuery: string;
  /** URL 쿼리스트링 원본. 필터를 갱신할 때 기존 파라미터를 보존하기 위해 사용 */
  searchParamsString?: string;
  /**
   * 광고 배너 렌더링 여부.
   * 프리렌더 fallback에서는 false를 전달합니다.
   * (fallback과 실제 트리가 모두 마운트되어 AdSense가 같은 슬롯에 중복 push되는 것 방지)
   */
  showAdBanner?: boolean;
}

/**
 * 리뷰 홈 본문.
 * 정적 렌더링 라우트에서 useSearchParams를 호출하면 가장 가까운 Suspense 경계까지
 * 서버 렌더링이 생략되어 크롤러에 빈 페이지가 전달되므로 파싱된 값을 props로 받습니다.
 * URL 파싱은 ReviewHomeViewWithParams가 담당합니다.
 */
export const ReviewHomeView = ({
  category,
  tag,
  isbn,
  searchQuery,
  searchParamsString = "",
  showAdBanner = true,
}: ReviewHomeViewProps) => {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const isFiltered = !!(category || tag || isbn || searchQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParamsString);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  const handleCategoryClick = (nextCategory: string) => {
    const params = new URLSearchParams(searchParamsString);

    if (category === nextCategory) {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  /** 하나의 필터만 걷어내고 나머지 파라미터는 보존한다. */
  const clearParam = (key: string) => {
    const params = new URLSearchParams(searchParamsString);
    params.delete(key);
    const query = params.toString();
    router.push(query ? `${PATHS.REVIEWS}?${query}` : PATHS.REVIEWS);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push(PATHS.REVIEWS);
  };

  return (
    <>
      <ReviewHomeFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
        selectedCategory={category}
        handleCategoryClick={handleCategoryClick}
        selectedTag={tag}
        clearTag={() => clearParam("tag")}
        selectedIsbn={isbn}
        clearIsbn={() => clearParam("isbn")}
      />

      <section className="mb-20 container mx-auto">
        {/* 광고 배너 */}
        {showAdBanner && (
          <AdBanner
            dataAdSlot="6903058843"
            dataAdFormat="horizontal"
            className="w-full mb-8"
          />
        )}

        {!isFiltered ? (
          <>
            <PopularReviewList />
            <ReviewFeedList />
          </>
        ) : (
          <ReviewGridList
            searchQuery={searchQuery}
            category={category}
            tag={tag}
            isbn={isbn}
            clearFilters={clearFilters}
          />
        )}
      </section>
    </>
  );
};
