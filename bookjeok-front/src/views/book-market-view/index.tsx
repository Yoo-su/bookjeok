"use client";

import { BookMarket } from "@/features/book/components/book-market";
import { PopularBookSaleList } from "@/features/book/components/book-market/popular-book-sale-list";

export const BookMarketView = () => {
  return (
    <div className="w-full py-8">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          중고 서적 마켓
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          원하는 책을 찾아보세요! 다양한 중고 서적들이 있습니다.
        </p>
      </section>

      <div className="mb-8">
        <PopularBookSaleList />
      </div>

      <BookMarket />
    </div>
  );
};
