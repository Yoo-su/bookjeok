"use client";

import { BookInfo, Review } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  BookOpen,
  Calendar,
  Eye,
  Share2,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Separator } from "@/shared/components/shadcn/separator";
import { ShareButton } from "@/shared/components/ui/share-button";
import { StarRating } from "@/shared/components/ui/star-rating";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";

interface ReviewDetailHeaderProps {
  review: Review;
  book: BookInfo | undefined;
}

export function ReviewDetailHeader({ review, book }: ReviewDetailHeaderProps) {
  const t = useTranslations("review.detail");
  const locale = useLocale();

  return (
    <header className="relative bg-white pt-20 pb-12">
      <div className="container mx-auto px-4 w-full">
        {/* 카테고리 & 날짜 - 상단 메타데이터 */}
        <div className="flex items-center gap-3 text-sm font-medium tracking-wider text-stone-500 mb-6 uppercase">
          <span className="text-secondary-foreground">
            {review.category || t("default_category")}
          </span>
          <Separator orientation="vertical" className="h-3 bg-stone-300" />
          <time
            dateTime={review.createdAt}
            className="font-normal text-stone-400"
          >
            {formatDate(review.createdAt, locale, "full")}
          </time>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 mb-8 leading-tight text-left break-keep">
          {review.title}
        </h1>

        {/* 작성자 정보 & 조회수 */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-8 mb-10">
          <div className="flex items-center gap-4">
            {review.user && (
              <UserAvatarMenu user={review.user} showNickname size="md" />
            )}
            <div className="h-8 w-px bg-stone-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-stone-400 text-sm">
              <Eye className="w-4 h-4" />
              <span>
                {review.viewCount.toLocaleString()} {t("reads")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareButton
              title={review.title}
              // book 관계가 빠진 응답에서 "undefined - undefined"가 공유 카드에
              // 그대로 실리던 자리. 없으면 설명을 비워 ShareButton 기본값에 맡긴다.
              description={book ? `${book.title} - ${book.author}` : undefined}
              imageUrl={book?.image ?? undefined}
            />
          </div>
        </div>

        {/* 책 정보 섹션 - 우아한 가로 형태 */}
        {book && (
          <div className="flex items-start gap-5 p-5 rounded-2xl bg-stone-50/50 border border-stone-100 hover:border-stone-200 transition-colors mb-10">
            {book.image ? (
              <Link href={PATHS.BOOK_DETAIL(book.isbn)} className="shrink-0">
                <div className="relative w-16 h-22 rounded-md overflow-hidden bg-stone-200 shadow-sm transition-transform hover:-translate-y-0.5">
                  <Image
                    src={book.image}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </Link>
            ) : (
              <div className="w-16 h-22 shrink-0 bg-stone-100 rounded-md flex items-center justify-center border border-stone-200">
                <BookOpen className="w-6 h-6 text-stone-400" />
              </div>
            )}

            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-widest text-white uppercase bg-[#3C3F45] px-2 py-0.5 rounded-sm">
                  {t("reviewed_book")}
                </span>
                {review.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <StarRating value={review.rating} readonly size={14} />
                  </div>
                )}
              </div>

              <Link href={PATHS.BOOK_DETAIL(book.isbn)} className="group block">
                <h3 className="text-lg font-bold text-stone-900 truncate group-hover:text-stone-700 transition-colors font-serif">
                  {book.title}
                </h3>
              </Link>
              <p className="text-sm text-stone-500 mb-2 truncate">
                {book.author} · {book.publisher}
              </p>
            </div>

            {book.pubdate && (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex mt-1 text-stone-400 font-normal border-stone-200"
              >
                {book.pubdate.slice(0, 4)}
              </Badge>
            )}
          </div>
        )}

        {/* 태그 리스트 - 하단 배치 */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {review.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm text-stone-500 hover:text-stone-900 hover:underline cursor-pointer italic px-1"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
