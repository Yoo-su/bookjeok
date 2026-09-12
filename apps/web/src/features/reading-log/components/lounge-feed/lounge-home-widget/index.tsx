"use client";

import { useLoungePopularQuery } from "@bookjeok/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";

import { ArrowRight } from "@/shared/components/icons/iconsax";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export function LoungeHomeWidget() {
  const t = useTranslations("lounge.home_widget");
  const { data, isLoading } = useLoungePopularQuery();

  if (isLoading) {
    return (
      <section className="w-full py-16 overflow-hidden">
        <div className="w-full mx-auto px-4">
          <div className="mb-14 border-b border-stone-200 pb-5 animate-pulse">
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-44 shrink-0">
                <Skeleton className="aspect-2/3 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 백엔드가 형태가 어긋난 200을 주면 여기서 터지고, 페이지 전체가 500이 된다.
  // 500은 ISR에 남지 않아 매 요청 재렌더되므로 섹션 부재로 흡수한다.
  if (!data?.items?.length) return null;

  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="w-full mx-auto px-4">
        {/* 섹션 헤더: 기존 RecentReviewSlider, RecentSalesSlider의 헤더 패턴 */}
        <div className="mb-14 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 text-left">
          <Link
            href={PATHS.LOUNGE}
            className="group flex justify-between items-end w-full"
          >
            <div className="pr-4">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
                <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
                  {t("title_prefix")}
                </span>
                {t("title_suffix")}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-stone-500 font-light break-keep">
                {t("desc")}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 ml-2 shrink-0">
              <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 -rotate-45 group-hover:rotate-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* 수평 스크롤 카드 */}
      <Swiper
        slidesPerView="auto"
        spaceBetween={20}
        className="pb-4 pt-4 -mt-4 px-4! overflow-visible!"
      >
        {data.items.slice(0, 6).map((item, index) => (
          <SwiperSlide
            key={item.isbn}
            className="w-40! sm:w-44! select-none group"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Link href={PATHS.LOUNGE}>
                {/* 도서 표지 */}
                <div className="relative aspect-2/3 w-full overflow-hidden bg-stone-50 mb-3.5 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
                  {item.book.image ? (
                    <Image
                      src={item.book.image}
                      alt={item.book.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <span className="text-xs text-stone-400 text-center font-medium">
                        {item.book.title}
                      </span>
                    </div>
                  )}

                  {/* 독자 수 뱃지 */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {t("readers_count", { count: item.readerCount })}
                  </div>
                </div>

                {/* 도서 정보 */}
                <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-stone-600 transition-colors">
                  {item.book.title}
                </h3>

                {/* Avatar Circles */}
                <AvatarCircles
                  size="sm"
                  avatars={item.recentReaders.map((r) => ({
                    imageUrl: r.profileImageUrl,
                    name: r.nickname,
                  }))}
                  extraCount={
                    item.readerCount > item.recentReaders.length
                      ? item.readerCount - item.recentReaders.length
                      : 0
                  }
                />
              </Link>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
