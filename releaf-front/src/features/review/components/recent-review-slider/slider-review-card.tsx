"use client";

import { format } from "date-fns";
import { BookOpen, Quote, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Review } from "@/features/review/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { PATHS } from "@/shared/constants/paths";

interface SliderReviewCardProps {
  review: Review;
}

/**
 * 메인페이지 최신 리뷰 슬라이더에서 사용되는 카드 컴포넌트
 * 세로형 매거진 스타일로 시각적 임팩트를 강화
 */
export const SliderReviewCard = ({ review }: SliderReviewCardProps) => {
  const book = review.book;

  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      className="group block w-full h-full"
    >
      <div className="relative w-[260px] h-[340px] rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-out transform-gpu hover:scale-[1.03] hover:shadow-2xl hover:shadow-amber-500/20">
        {/* 배경 블러 이미지 */}
        {book?.image && (
          <div className="absolute inset-0">
            <Image
              src={book.image}
              alt=""
              fill
              sizes="260px"
              className="object-cover blur-sm scale-110"
            />
          </div>
        )}

        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-linear-to-b from-stone-900/60 via-stone-900/80 to-stone-900/95" />

        {/* 메인 책 이미지 */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-36 rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/20 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
          {book?.image ? (
            <Image
              src={book.image}
              alt={book.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-stone-200 text-stone-400">
              <BookOpen className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* 인용 아이콘 */}
        <div className="absolute top-5 left-4">
          <Quote className="w-5 h-5 text-amber-400/60" />
        </div>

        {/* 별점 배지 */}
        {review.rating > 0 && (
          <div className="absolute top-5 right-4 flex items-center gap-1 px-2 py-1 bg-amber-500/20 backdrop-blur-sm rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              {review.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* 하단 콘텐츠 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          {/* 리뷰 제목 */}
          <h3 className="text-base font-bold leading-snug line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors duration-300">
            {review.title}
          </h3>

          {/* 책 제목 */}
          <p className="text-xs text-stone-400 truncate mb-3">
            『{book?.title || "Unknown"}』
          </p>

          {/* 태그 */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {review.tags.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-medium text-amber-200/80 bg-amber-500/20 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 구분선 */}
          <div className="h-px bg-linear-to-r from-transparent via-stone-600 to-transparent mb-3" />

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 ring-1 ring-white/20">
                <AvatarImage
                  src={review.user?.profileImageUrl || undefined}
                  alt={review.user?.nickname}
                />
                <AvatarFallback className="bg-stone-700 text-[10px] font-bold text-stone-300">
                  {review.user?.nickname?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-stone-300 truncate max-w-[100px]">
                {review.user?.nickname || "Anonymous"}
              </span>
            </div>
            <span className="text-[10px] text-stone-500">
              {format(new Date(review.createdAt), "yyyy.MM.dd")}
            </span>
          </div>
        </div>

        {/* 호버 시 테두리 효과 */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-amber-400/40 transition-all duration-300" />
      </div>
    </Link>
  );
};
