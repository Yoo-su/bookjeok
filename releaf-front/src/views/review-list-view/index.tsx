"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { ReviewFeedList } from "@/features/review/components/review-feed-list";
import { ReviewGridList } from "@/features/review/components/review-grid-list";
import { ReviewListFilters } from "@/features/review/components/review-list-filters";
import { ReviewListHero } from "@/features/review/components/review-list-hero";
import {
  useReviewFeedsQuery,
  useReviewsInfiniteQuery,
} from "@/features/review/queries";
import { PATHS } from "@/shared/constants/paths";

export const ReviewListView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchQuery);

  const isFiltered = !!(categoryParam || searchQuery);

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviewsInfiniteQuery({
    limit: 12,
    category: categoryParam,
    search: searchQuery,
    enabled: isFiltered,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) || [];

  const { data: feedsData, isLoading: isFeedsLoading } =
    useReviewFeedsQuery(!isFiltered);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);

    if (categoryParam === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push(PATHS.REVIEWS);
  };

  const isLoading = isFiltered ? isReviewsLoading : isFeedsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ReviewListHero />

      <ReviewListFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
        selectedCategory={categoryParam}
        handleCategoryClick={handleCategoryClick}
      />

      <section className="mb-20 container mx-auto">
        {!isFiltered ? (
          <ReviewFeedList feedsData={feedsData} />
        ) : (
          <ReviewGridList
            reviews={reviews}
            searchQuery={searchQuery}
            category={categoryParam}
            clearFilters={clearFilters}
            loadMoreRef={ref}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </section>
    </>
  );
};
