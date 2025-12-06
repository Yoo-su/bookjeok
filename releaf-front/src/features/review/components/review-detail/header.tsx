"use client";

import { format } from "date-fns";
import { BookOpen, Eye } from "lucide-react";
import Image from "next/image";

import { BookInfo } from "@/features/book/types";
import { Review } from "@/features/review/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Badge } from "@/shared/components/shadcn/badge";
import { StarRating } from "@/shared/components/ui/star-rating";

interface ReviewDetailHeaderProps {
  review: Review;
  book: BookInfo | undefined;
}

export function ReviewDetailHeader({ review, book }: ReviewDetailHeaderProps) {
  return (
    <header className="relative bg-stone-50 border-b border-stone-100 pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/50 text-stone-600 text-xs font-medium uppercase tracking-wider">
            <span>{review.category || "Book Review"}</span>
          </div>
          {review.rating > 0 && (
            <StarRating value={review.rating} readonly size={24} />
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-6 leading-tight">
          {review.title}
        </h1>

        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {review.tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-3 py-1 text-sm font-normal bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 text-stone-500 text-sm mb-10">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border border-stone-200">
              <AvatarImage
                src={review.user?.profileImageUrl || undefined}
                alt={review.user?.nickname}
              />
              <AvatarFallback className="bg-stone-200 text-xs font-bold text-stone-600">
                {review.user?.nickname?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-stone-900">
              {review.user?.nickname || "Anonymous"}
            </span>
          </div>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <time dateTime={review.createdAt}>
            {format(new Date(review.createdAt), "MMMM d, yyyy")}
          </time>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{review.viewCount.toLocaleString()}</span>
          </div>
        </div>

        {/* 책 정보 카드 - 플로팅 */}
        <div className="inline-flex items-center gap-4 bg-white p-3 pr-6 rounded-xl shadow-sm border border-stone-100 mx-auto">
          {book?.image ? (
            <div className="relative w-12 h-16 shrink-0 rounded-md overflow-hidden bg-stone-100 border border-stone-100">
              <Image
                src={book.image}
                alt={book.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="w-12 h-16 shrink-0 bg-stone-100 rounded-md flex items-center justify-center border border-stone-100">
              <BookOpen className="w-5 h-5 text-stone-400" />
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-bold text-stone-900 line-clamp-1 max-w-[200px]">
              {book?.title}
            </p>
            <p className="text-xs text-stone-500">{book?.author}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
