"use client";

import { MyFeedback } from "@bookjeok/core";
import { useMyFeedbackInfiniteQuery } from "@bookjeok/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Loader2, MessageSquareText } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { formatDate } from "@/shared/utils/format-date";

import { FEEDBACK_TYPE_KEYS } from "../../constants";
import { FeedbackButton } from "../feedback-button";
import { FeedbackStatusBadge } from "../feedback-status-badge";

/**
 * 내가 보낸 문의와 처리 상태·운영자 답변
 */
export const MyFeedbackList = () => {
  const t = useTranslations("feedback");
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyFeedbackInfiniteQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-stone-500">
        {t("my.load_error")}
      </p>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <MessageSquareText className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-stone-900">
            {t("my.empty_title")}
          </h3>
          <p className="max-w-sm text-xs text-stone-400">
            {t("my.empty_desc")}
          </p>
        </div>
        <FeedbackButton className="mt-2 inline-flex h-9 items-center rounded-lg bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800">
          {t("open")}
        </FeedbackButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <MyFeedbackCard feedback={item} />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("load_more")
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const MyFeedbackCard = ({ feedback }: { feedback: MyFeedback }) => {
  const t = useTranslations("feedback");
  const locale = useLocale();

  return (
    <article className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 text-xs text-stone-400">
        <span>
          {formatDate(feedback.createdAt, locale, "date")} ·{" "}
          {t(`types.${FEEDBACK_TYPE_KEYS[feedback.type]}`)}
        </span>
        <FeedbackStatusBadge status={feedback.status} />
      </div>

      {feedback.book && (
        <p className="text-sm font-semibold text-stone-900">
          {feedback.book.title}
          {(feedback.book.author || feedback.book.publisher) && (
            <span className="ml-1.5 font-normal text-stone-500">
              {[feedback.book.author, feedback.book.publisher]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </p>
      )}
      {feedback.content && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
          {feedback.content}
        </p>
      )}

      {feedback.reply ? (
        <div className="space-y-1.5 rounded-xl bg-stone-50 p-3.5">
          <p className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-900">
            {t("my.reply_label")}
            {feedback.repliedAt && (
              <span className="font-normal text-stone-400">
                {formatDate(feedback.repliedAt, locale, "date")}
              </span>
            )}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {feedback.reply}
          </p>
        </div>
      ) : (
        <p className="text-xs text-stone-400">{t("my.reply_waiting")}</p>
      )}
    </article>
  );
};
