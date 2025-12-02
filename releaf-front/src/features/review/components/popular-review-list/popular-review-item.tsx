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

interface PopularReviewItemProps {
  review: Review;
}

export function PopularReviewItem({ review }: PopularReviewItemProps) {
  return (
    <Link href={`/review/${review.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-stone-200 overflow-hidden group">
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-2">
            <Badge
              variant="outline"
              className="text-xs font-normal text-stone-500 border-stone-200"
            >
              {review.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <Eye className="w-3 h-3" />
              <span>{review.viewCount?.toLocaleString() || 0}</span>
            </div>
          </div>
          <CardTitle className="text-lg font-serif line-clamp-2 group-hover:text-green-700 transition-colors mt-2">
            {review.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="hidden md:block text-sm text-stone-600 line-clamp-2 mb-4 h-10">
            {review.content.replace(/<[^>]*>?/gm, "")}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={review.user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {review.user?.nickname?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-stone-500 font-medium truncate max-w-[80px]">
                {review.user?.nickname}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400">
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>
                  {review.reactionCounts
                    ? Object.values(review.reactionCounts).reduce(
                        (a, b) => a + b,
                        0
                      )
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
