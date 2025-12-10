"use client";

import { Search, X } from "lucide-react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BOOK_DOMAINS } from "@/features/review/constants";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

interface ReviewHomeFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isFiltered: boolean;
  clearFilters: () => void;
  selectedCategory: string | null;
  handleCategoryClick: (category: string) => void;
}

export function ReviewHomeFilters({
  searchInput,
  setSearchInput,
  handleSearch,
  isFiltered,
  clearFilters,
  selectedCategory,
  handleCategoryClick,
}: ReviewHomeFiltersProps) {
  return (
    <section className="container mx-auto mb-12 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="리뷰 제목, 내용, 태그 또는 책 제목으로 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-4 h-12 rounded-full border-stone-200 focus-visible:ring-stone-400"
          />
        </form>
        {isFiltered && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="shrink-0 rounded-full border-stone-300 hover:bg-stone-100"
          >
            <X className="w-4 h-4 mr-2" />
            필터 초기화
          </Button>
        )}
      </div>

      <div className="w-full">
        <Swiper
          modules={[FreeMode]}
          spaceBetween={8}
          slidesPerView="auto"
          freeMode={true}
          className="w-full"
        >
          {BOOK_DOMAINS.map((category) => (
            <SwiperSlide key={category} className="w-auto!">
              <Badge
                variant={selectedCategory === category ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-1.5 text-sm font-normal transition-colors hover:bg-stone-100",
                  selectedCategory === category && "hover:bg-primary/90"
                )}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Badge>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
