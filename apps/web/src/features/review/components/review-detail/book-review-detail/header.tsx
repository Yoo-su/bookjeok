"use client";

import { BookInfo, Review } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { getReviewShareDescription } from "@/features/review/utils/share";
import { BookOpen, Eye } from "@/shared/components/icons/iconsax";
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
  const tAria = useTranslations("common.aria");
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
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-stone-900 mb-8 leading-tight text-left break-keep">
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
              description={getReviewShareDescription(review)}
              imageUrl={book?.image ?? undefined}
            />
          </div>
        </div>

        {/* 리뷰한 책. 링크 하나로 감싸 도서 상세로 보낸다. */}
        {book && (
          <Link
            href={PATHS.BOOK_DETAIL(book.isbn)}
            className="group mb-8 flex items-center gap-5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-700"
          >
            <div className="relative aspect-[5/7] w-16 shrink-0 origin-bottom-left overflow-hidden rounded-[2px] bg-stone-100 shadow-[2px_4px_12px_rgb(0_0_0/0.18)] ring-1 ring-black/5 transition-transform duration-300 motion-safe:group-hover:-rotate-3 sm:w-[72px]">
              {book.image ? (
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="size-6 text-stone-400" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-400">{t("reviewed_book")}</p>
              <h2 className="mt-1 line-clamp-2 font-serif text-lg font-bold leading-snug text-stone-900 underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-stone-900">
                {book.title}
              </h2>
              <p className="mt-1 truncate text-sm text-stone-500">
                {[book.author, book.publisher, book.pubdate?.slice(0, 4)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {review.rating > 0 && (
                <div className="mt-2 flex items-center gap-1.5 sm:hidden">
                  <StarRating value={review.rating} readonly size={13} />
                  <span className="text-sm font-semibold tabular-nums text-stone-700">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {review.rating > 0 && (
              <div className="hidden shrink-0 flex-col items-end gap-2 self-stretch border-l border-stone-200 pl-6 sm:flex sm:justify-center">
                <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-stone-900">
                  {review.rating.toFixed(1)}
                  <span className="ml-0.5 text-base font-normal text-stone-400">
                    /5
                  </span>
                </p>
                <StarRating value={review.rating} readonly size={12} />
              </div>
            )}
          </Link>
        )}

        {/* 태그. 같은 태그가 달린 리뷰 목록으로 보낸다. */}
        {review.tags && review.tags.length > 0 && (
          <div className="-mx-1 flex flex-wrap gap-x-2">
            {review.tags.map((tag: string) => (
              <Link
                key={tag}
                href={PATHS.REVIEWS_BY_TAG(tag)}
                aria-label={tAria("tag_filter", { tag })}
                className="inline-block px-1 py-1.5 text-sm text-stone-500 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
