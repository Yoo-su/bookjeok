"use client";

import { format } from "date-fns";
import { BookOpen, MessageCircle, Star } from "lucide-react";
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
 * 가볍고 친근한 느낌으로 누구나 쉽게 접근할 수 있도록 디자인
 */
export const SliderReviewCard = ({ review }: SliderReviewCardProps) => {
  const book = review.book;

  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      className="group block w-full h-full"
    >
      <div className="relative w-[260px] h-[340px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1">
        {/* 상단 책 이미지 영역 */}
        <div className="relative h-[140px] bg-linear-to-br from-sky-50 to-teal-50 flex items-center justify-center">
          <div className="relative w-20 h-28 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105">
            {book?.image ? (
              <Image
                src={book.image}
                alt={book.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* 별점 배지 */}
          {review.rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-gray-700">
                {review.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* 말풍선 아이콘 */}
          <div className="absolute top-3 left-3">
            <MessageCircle className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        {/* 하단 콘텐츠 영역 */}
        <div className="p-4 flex flex-col h-[200px]">
          {/* 리뷰 제목 */}
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-1.5 group-hover:text-sky-600 transition-colors duration-200">
            {review.title}
          </h3>

          {/* 책 제목 & 저자 */}
          <p className="text-xs text-gray-400 truncate">
            {book?.title || "Unknown"}
          </p>
          <p className="text-[10px] text-gray-300 truncate mb-2">
            {book?.author || ""}
          </p>

          {/* 태그 (하단 고정, overflow 처리) */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden mt-auto">
              {review.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-medium text-sky-600 bg-sky-50 rounded-full whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
              {review.tags.length > 3 && (
                <span className="text-[10px] text-gray-400 shrink-0">
                  +{review.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-3" />

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 ring-1 ring-gray-100" data-nosnippet>
                <AvatarImage
                  src={review.user?.profileImageUrl || undefined}
                  alt={review.user?.nickname}
                />
                <AvatarFallback className="bg-sky-100 text-[10px] font-bold text-sky-600">
                  {review.user?.nickname?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">
                {review.user?.nickname || "Anonymous"}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              {format(new Date(review.createdAt), "MM.dd")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
