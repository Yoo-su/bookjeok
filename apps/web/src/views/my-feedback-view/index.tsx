"use client";

import { useTranslations } from "next-intl";

import { FeedbackButton } from "@/features/feedback/components/feedback-button";
import { MyFeedbackList } from "@/features/feedback/components/my-feedback-list";
import { ArrowLeft } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

/**
 * 나의 문의 페이지 View
 */
export const MyFeedbackView = () => {
  const t = useTranslations("feedback.my");
  const tFeedback = useTranslations("feedback");
  const tMyPage = useTranslations("my_page");

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <Link
          href={PATHS.MY_PAGE}
          className="mb-2 inline-flex items-center gap-1.5 py-1.5 text-xs text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tMyPage("title")}
        </Link>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              {t("subtitle")}
            </p>
          </div>
          <FeedbackButton className="inline-flex h-9 items-center self-start rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-700 hover:border-stone-500 hover:text-stone-900 sm:self-auto">
            {tFeedback("open")}
          </FeedbackButton>
        </div>
      </div>

      <MyFeedbackList />
    </div>
  );
};
