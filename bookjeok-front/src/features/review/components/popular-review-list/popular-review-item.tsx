import { Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Review } from "@/features/review/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Badge } from "@/shared/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { PATHS } from "@/shared/constants/paths";

interface PopularReviewItemProps {
  review: Review;
}

export function PopularReviewItem({ review }: PopularReviewItemProps) {
  return (
    <Link href={PATHS.REVIEW_DETAIL(review.id)} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-stone-200 overflow-hidden group bg-white">
        {/* 헤더: 책 정보 */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate">
              {review.book.title}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
            <span className="text-[10px] font-medium tracking-wider text-stone-400 uppercase truncate shrink-0 max-w-[40%]">
              {review.book.author}
            </span>
          </div>
        </div>

        <CardHeader className="px-5 py-0">
          <CardTitle className="text-xl font-serif font-bold leading-tight line-clamp-2 text-stone-800 group-hover:text-stone-600 transition-colors">
            {review.title}
          </CardTitle>
          <div className="flex items-center gap-2 mt-3 mb-2">
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-[10px] font-normal bg-stone-100 text-stone-500 hover:bg-stone-200"
            >
              {review.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-4 grow flex flex-col">
          <p className="hidden md:block text-sm leading-relaxed text-stone-500 line-clamp-2 mb-4 font-light max-h-12 overflow-hidden">
            {review.content.replace(/<[^>]*>?/gm, "")}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100/50">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-6 h-6 border border-stone-100">
                <AvatarImage src={review.user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-[9px] bg-stone-100 text-stone-500">
                  {review.user?.nickname?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-stone-500 font-medium truncate max-w-[100px]">
                {review.user?.nickname}
              </span>
            </div>

            <div className="flex items-center gap-3 text-stone-400">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">
                  {review.viewCount?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">
                  {review.reactionCount || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
