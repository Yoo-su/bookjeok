"use client";

import { Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { usePopularReviewsQuery } from "@/features/review/queries";
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
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export function PopularReviewList() {
  const { data: reviews, isLoading } = usePopularReviewsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-stone-900">🔥 지금 뜨는 리뷰</h2>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-600 hover:bg-orange-200"
        >
          HOT
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((review) => (
          <Link key={review.id} href={`/review/${review.id}`}>
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
                <p className="text-sm text-stone-600 line-clamp-2 mb-4 h-10">
                  {review.content.replace(/<[^>]*>?/gm, "")}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={review.user?.profileImageUrl || undefined}
                      />
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
        ))}
      </div>
    </section>
  );
}
