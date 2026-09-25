import { Review } from "@bookjeok/core";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface PopularReviewItemProps {
  review: Review;
}

// 인기 리뷰 카드 컴포넌트 - 미니멀 텍스트 중심 디자인
export function PopularReviewItem({ review }: PopularReviewItemProps) {
  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      prefetch={false}
      className="h-full flex flex-col bg-white border border-stone-100 p-5 cursor-pointer group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* 상단: 카테고리 + 별점 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-stone-400 tracking-wider uppercase">
          {review.category}
        </span>
        {review.rating > 0 && (
          <div className="flex items-center gap-0.5">
            <span className="text-amber-400 text-[11px]">★</span>
            <span className="text-[11px] text-stone-400 font-medium">
              {review.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 리뷰 제목 */}
      <h3 className="text-lg font-semibold leading-snug line-clamp-2 text-stone-800 group-hover:text-stone-500 transition-colors duration-200 mb-2">
        {review.title}
      </h3>

      {/* 책 정보 */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] text-stone-400 truncate font-light">
          {review.book.title}
        </span>
        <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
        <span className="text-[11px] text-stone-300 truncate shrink-0 max-w-[35%] font-light">
          {review.book.author}
        </span>
      </div>

      {/* 본문 미리보기 */}
      <p className="text-sm leading-relaxed text-stone-400 line-clamp-2 mt-1 mb-4 font-light max-h-14 overflow-hidden">
        {review.content.replace(/<[^>]*>?/gm, "")}
      </p>

      {/* 하단: 작성자 + 통계 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5" data-nosnippet>
            <AvatarImage
              src={getProfileImageUrl(review.user?.profileImageUrl)}
            />
            <AvatarFallback className="text-[9px] bg-stone-100 text-stone-500">
              {review.user?.nickname?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-stone-500 truncate max-w-[100px] font-light">
            {review.user?.nickname}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-stone-300">
          <span>{review.viewCount?.toLocaleString() || 0} views</span>
          <span>{review.reactionCount || 0} likes</span>
        </div>
      </div>
    </Link>
  );
}
