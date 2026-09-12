"use client";

import { useInfiniteRelatedSalesQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Plus } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { UsedBookSale } from "../../common/book-sale-item";
import { RelatedSalesSkeleton } from "./skeleton";

interface RelatedSalesProps {
  isbn: string;
}

/**
 * 책 상세페이지 관련 판매글 섹션
 * - 최대 4개 표시 + 더보기 링크
 * - 슬라이더 형태
 */
export const RelatedSales = ({ isbn }: RelatedSalesProps) => {
  const t = useTranslations("market.detail.related");
  // 뷰포트 진입 시 데이터 로딩
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  // 페이지네이션을 위한 무한 쿼리
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteRelatedSalesQuery({
    isbn,
    limit: 4,
    enabled: inView,
  });

  const sales =
    data?.pages.flatMap((page) =>
      Array.isArray(page?.sales) ? page.sales : [],
    ) ?? [];
  const totalCount = data?.pages[0]?.total || 0;

  return (
    <section ref={ref} className="w-full py-16 border-t border-stone-100">
      {/* 헤더 */}
      <div className="flex items-baseline justify-between mb-8 px-1">
        <h2 className="text-xl font-serif text-stone-900 tracking-tight">
          {t("title")}
        </h2>
      </div>

      {/* 로딩 상태 */}
      {(!inView || isLoading) && <RelatedSalesSkeleton />}

      {/* 에러 상태 */}
      {isError && (
        <div className="text-center text-red-500 py-8">{t("error")}</div>
      )}

      {/* 데이터 없음 상태 */}
      {inView && !isLoading && !isError && sales.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <p className="text-stone-500 mb-4">{t("empty")}</p>
          <Link href={PATHS.BOOK_SALES_REGISTER}>
            <Button variant="outline" size="sm">
              {t("register_first")}
            </Button>
          </Link>
        </div>
      )}

      {/* 슬라이더 */}
      {inView && !isLoading && !isError && sales.length > 0 && (
        <Swiper
          modules={[FreeMode]}
          freeMode={true}
          slidesPerView="auto"
          spaceBetween={16}
          className="w-full overflow-visible! px-1! py-4"
        >
          {sales.map((sale, index) => (
            <SwiperSlide
              key={sale.id}
              className="w-[180px]! sm:w-[220px]! h-auto! select-none pr-4"
            >
              <UsedBookSale.Root sale={sale} priority={index < 2}>
                <UsedBookSale.Image />
                <UsedBookSale.Content>
                  <UsedBookSale.Title />
                  <UsedBookSale.Price />
                  <UsedBookSale.Location className="hidden sm:flex" />
                  <UsedBookSale.Meta className="hidden sm:flex" />
                </UsedBookSale.Content>
              </UsedBookSale.Root>
            </SwiperSlide>
          ))}

          {/* 더보기 슬라이드 */}
          {hasNextPage && (
            <SwiperSlide className="w-[180px]! sm:w-[220px]! h-auto! select-none pr-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="group block h-full w-full text-left disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div
                  className={cn(
                    "h-full w-full flex flex-col items-center justify-center gap-3",
                    "rounded-sm border border-dashed border-stone-300 bg-stone-50/30",
                    "transition-all duration-300",
                    "group-hover:bg-stone-100 group-hover:border-stone-400",
                  )}
                >
                  {isFetchingNextPage ? (
                    <span className="text-sm font-medium text-stone-400 animate-pulse">
                      {t("loading")}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm group-hover:scale-110 group-hover:border-stone-300 transition-all">
                        <Plus className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                      </div>
                      <div className="text-center">
                        <span className="block font-serif text-sm font-medium text-stone-600 group-hover:text-stone-900 transition-colors">
                          {t("view_more")}
                        </span>
                        <span className="block text-[10px] text-stone-400 mt-1">
                          {t("more_count", {
                            count: totalCount - sales.length,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </button>
            </SwiperSlide>
          )}
        </Swiper>
      )}
    </section>
  );
};
