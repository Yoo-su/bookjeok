import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/shared/components/shadcn/button";

import { UsedBookSale } from "../../types";
import { BookSaleCard } from "../common/book-sale-card";

interface RelatedSalesSliderProps {
  sales: UsedBookSale[];
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

export const RelatedSalesSlider = ({
  sales,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: RelatedSalesSliderProps) => {
  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView={"auto"}
        navigation={{
          nextEl: ".swiper-button-next-related",
          prevEl: ".swiper-button-prev-related",
        }}
        className="!p-1" // for box-shadow
      >
        {sales.map((sale, index) => (
          <SwiperSlide key={sale.id} className="!w-[250px] py-8">
            <BookSaleCard sale={sale} idx={index} />
          </SwiperSlide>
        ))}

        {hasNextPage && (
          <SwiperSlide className="!w-[250px] py-8">
            <div className="flex h-[395px] w-full items-center justify-center">
              <Button
                variant="outline"
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-gray-50 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">더 보기</span>
                    <ChevronRight className="h-8 w-8" />
                  </div>
                )}
              </Button>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      {/* Custom Navigation */}
      <div className="swiper-button-prev-related absolute left-[-5px] top-1/2 z-10 -translate-y-1/2 transform">
        <Button size="icon" variant="outline" className="rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="swiper-button-next-related absolute right-[-5px] top-1/2 z-10 -translate-y-1/2 transform">
        <Button size="icon" variant="outline" className="rounded-full">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
