"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { PopularReviewList } from "@/features/review/components/popular-review-list";
import { ReviewFeedList } from "@/features/review/components/review-feed-list";
import { ReviewGridList } from "@/features/review/components/review-grid-list";
import { ReviewHomeFilters } from "@/features/review/components/review-home-filters";
import { ReviewHomeHero } from "@/features/review/components/review-home-hero";
import { PATHS } from "@/shared/constants/paths";

export const ReviewHomeView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchQuery);

  const isFiltered = !!(categoryParam || searchQuery);

  const handleSearch = (e: FormEvent) => {
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

  return (
    <>
      <ReviewHomeHero />

      <ReviewHomeFilters
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
          <>
            <PopularReviewList />
            <ReviewFeedList />
          </>
        ) : (
          <ReviewGridList
            searchQuery={searchQuery}
            category={categoryParam}
            clearFilters={clearFilters}
          />
        )}
      </section>
    </>
  );
};
