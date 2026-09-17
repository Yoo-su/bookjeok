"use client";

import { Review } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface ReviewRowProps {
  review: Review;
}

/**
 * 홈화면 최신 리뷰 리스트에서 사용되는 개별 행(Row) 컴포넌트
 * 책 표지, 평점, 제목, 본문 요약, 작성자 정보 등을 매거진 피드 스타일로 노출
 */
export const ReviewRow = ({ review }: ReviewRowProps) => {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const book = review.book;

  // HTML 태그 제거 및 본문 텍스트 요약 가공
  const plainContent = review.content
    ? review.content
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      // 티커가 20건을 차례로 뷰포트에 밀어 넣으므로 기본 prefetch를 두면
      // 클릭 없이 리뷰 상세 20개가 ISR에 구워진다
      prefetch={false}
      className="group flex items-center gap-4 sm:gap-6 py-5 border-b border-stone-100 hover:bg-stone-50/50 px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-xl transition-all duration-300 ease-out"
    >
      {/* 1. 도서 미니 표지 */}
      <div className="relative w-12 h-17 sm:w-14 sm:h-20 bg-stone-50 shrink-0 border border-stone-200/60 shadow-sm overflow-hidden rounded-md transition-all duration-300 group-hover:shadow-md">
        {book?.image ? (
          <Image
            src={book.image}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 48px, 56px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-[9px] text-stone-300 leading-tight text-center font-light">
            No Image
          </div>
        )}
      </div>

      {/* 2. 리뷰 텍스트 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
          {review.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <span className="text-amber-400 text-xs sm:text-[13px]">★</span>
              <span className="text-xs sm:text-[11px] font-medium text-stone-500">
                {review.rating.toFixed(1)}
              </span>
            </div>
          )}
          {review.rating > 0 && book?.title && (
            <span className="text-[10px] text-stone-300 hidden sm:inline">
              |
            </span>
          )}
          {book?.title && (
            <span className="text-[11px] text-stone-400 truncate max-w-[180px] sm:max-w-[300px] font-light">
              {book.title}
            </span>
          )}
        </div>

        {/* 리뷰 제목 */}
        <h3 className="text-sm sm:text-base font-semibold text-stone-800 truncate group-hover:text-stone-500 transition-colors duration-250 mb-1 leading-snug">
          {review.title}
        </h3>

        {/* 리뷰 내용 1줄 요약 */}
        {plainContent && (
          <p className="text-xs sm:text-sm text-stone-500 font-light line-clamp-1 break-all mb-1.5">
            {plainContent}
          </p>
        )}

        {/* 태그 영역 */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {review.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[10px] text-stone-400 font-light">
                #{tag}
              </span>
            ))}
            {review.tags.length > 3 && (
              <span className="text-[10px] text-stone-300 font-light">
                +{review.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. 작성자 및 작성일 */}
      <div className="flex items-center gap-3 shrink-0 pl-2">
        <div className="flex flex-col items-end text-right">
          <span className="text-xs sm:text-sm font-medium text-stone-700 truncate max-w-[80px] sm:max-w-[120px]">
            {review.user?.nickname || tCommon("anonymous")}
          </span>
          <span className="text-[10px] text-stone-400 font-light mt-0.5 sm:mt-1">
            {formatDate(review.createdAt, locale, "monthDay")}
          </span>
        </div>
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-stone-100 hidden sm:flex">
          <AvatarImage
            src={getProfileImageUrl(review.user?.profileImageUrl)}
            alt={review.user?.nickname}
          />
          <AvatarFallback className="bg-stone-50 text-xs font-light text-stone-400">
            {review.user?.nickname?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </Link>
  );
};
