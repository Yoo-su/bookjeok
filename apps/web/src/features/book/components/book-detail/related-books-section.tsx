"use client";

import { BookSearchField } from "@bookjeok/core";
import { useBookListQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "@/features/book/components/common/book-card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface RelatedBooksSectionProps {
  title: string;
  query: string;
  currentIsbn: string;
  queryType?: BookSearchField;
}

export const RelatedBooksSection = ({
  title,
  query,
  currentIsbn,
  queryType = "Keyword",
}: RelatedBooksSectionProps) => {
  const t = useTranslations("book.detail");

  const { data: books, isLoading } = useBookListQuery({
    query,
    display: 20,
    sort: "sim",
    queryType,
  });

  // 매 렌더 새 배열이면 아래 useMemo가 매번 다시 섞는다
  const filteredBooks = useMemo(
    () => books?.filter((book) => book.isbn !== currentIsbn) || [],
    [books, currentIsbn],
  );

  // ISBN을 기반으로 한 결정론적 셔플 (Fisher-Yates with LCG)
  const displayBooks = useMemo(() => {
    if (!filteredBooks.length) return [];

    // ISBN의 숫자들을 더해 초기 시드값 생성
    let seed = currentIsbn
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Linear Congruential Generator (LCG)
    const nextRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // 원본 배열 복사
    const shuffled = [...filteredBooks];

    // Fisher-Yates Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 모바일(Swiper)에서는 10개, 데스크탑(Grid)에서는 5개만 보여줄 예정
    return shuffled.slice(0, 10);
  }, [filteredBooks, currentIsbn]);

  if (!isLoading && displayBooks.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif tracking-tight text-gray-900 md:text-2xl">
          {title}
        </h2>
        <Link
          href={{ pathname: PATHS.BOOK_SEARCH, query: { q: query } }}
          className="text-sm font-medium text-gray-500 hover:text-primary"
        >
          {t("more_books")}
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <BookCard.Skeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* 모바일: Swiper */}
          <div className="block md:hidden -mx-4 px-4">
            <Swiper slidesPerView={2.2} spaceBetween={12} className="w-full">
              {displayBooks.map((book) => (
                <SwiperSlide key={book.isbn}>
                  <BookCard book={book} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 데스크탑: Grid (5개만 노출) */}
          <div className="hidden md:grid grid-cols-3 gap-4 lg:grid-cols-5">
            {displayBooks.slice(0, 5).map((book) => (
              <BookCard key={book.isbn} book={book} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
