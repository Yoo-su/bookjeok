"use client";

import { useTranslations } from "next-intl";

import { MyReviewList } from "@/features/review/components/review-list/my-review-list";
import { ArrowLeft, Plus } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export default function MyReviewsPage() {
  const t = useTranslations("my_reviews");
  const tMyPage = useTranslations("my_page");

  return (
    <div className="w-full space-y-6">
      {/* 상단 헤더 */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <Link
          href={PATHS.MY_PAGE}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tMyPage("title")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="h-8.5 px-3.5 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 gap-1.5 shadow-2xs rounded-lg cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Link href={PATHS.REVIEW_WRITE}>
              <Plus className="h-3.5 w-3.5" />
              {t("btn_write_review")}
            </Link>
          </Button>
        </div>
      </div>

      {/* 내가 쓴 리뷰 목록 */}
      <MyReviewList />
    </div>
  );
}
