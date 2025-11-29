"use client";

import { format } from "date-fns";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Review } from "@/features/review/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { StarRating } from "@/shared/components/ui/star-rating";

interface ReviewCardProps {
  review: Review;
  priority?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export function ReviewCard({
  review,
  priority = false,
  onDelete,
  onEdit,
}: ReviewCardProps) {
  const book = review.book;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(review.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(review.id);
  };

  return (
    <Link href={`/review/${review.id}`} className="group block h-full relative">
      <article className="flex h-[180px] bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all duration-300">
        {/* 이미지 컨테이너 (좌측) */}
        <div className="relative w-[120px] shrink-0 overflow-hidden bg-stone-100">
          {book?.image ? (
            <Image
              src={book.image}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="120px"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-300">
              <BookOpen className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* 콘텐츠 (우측) */}
        <div className="flex-1 flex flex-col p-3 min-w-0">
          <div className="flex flex-col gap-0.5 mb-1.5">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider line-clamp-1">
              {book?.author || "Unknown"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">
                {format(new Date(review.createdAt), "yyyy.MM.dd")}
              </span>
              {review.rating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating value={review.rating} readonly size={10} />
                </div>
              )}
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900 mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {review.title}
          </h3>

          {/* 태그 */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1 mb-auto overflow-hidden mask-linear-fade">
              {review.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded-full border border-stone-100 whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5 border border-stone-200">
                <AvatarImage
                  src={review.user?.profileImageUrl || undefined}
                  alt={review.user?.nickname}
                />
                <AvatarFallback className="bg-stone-100 text-[9px] font-bold text-stone-500">
                  {review.user?.nickname?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-stone-600 line-clamp-1">
                {review.user?.nickname || "Anonymous"}
              </span>
            </div>

            <div className="flex items-center">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-blue-500 hover:bg-blue-50"
                  onClick={handleEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-red-500 hover:bg-red-50 -mr-1"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
