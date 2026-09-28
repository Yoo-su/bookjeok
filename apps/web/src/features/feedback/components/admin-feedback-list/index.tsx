"use client";

import {
  AdminFeedback,
  FeedbackStatus,
  FeedbackType,
  GetAdminFeedbackParams,
} from "@bookjeok/core";
import { useAdminFeedbackInfiniteQuery } from "@bookjeok/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Loader2 } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@/shared/utils/format-date";

import {
  FEEDBACK_STATUS_KEYS,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPE_KEYS,
  FEEDBACK_TYPES,
} from "../../constants";
import { AdminFeedbackEditDialog } from "../admin-feedback-edit-dialog";
import { FeedbackStatusBadge } from "../feedback-status-badge";

/** 잘못 인코딩된 경로여도 화면이 깨지지 않게 */
const safeDecode = (path: string) => {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

/**
 * 운영자 문의 목록. 기본은 접수됨만 보여 처리할 것부터 보이게 한다
 */
export const AdminFeedbackList = () => {
  const t = useTranslations("feedback");
  const [filters, setFilters] = useState<GetAdminFeedbackParams>({
    status: FeedbackStatus.RECEIVED,
  });
  const [editing, setEditing] = useState<AdminFeedback | null>(null);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminFeedbackInfiniteQuery(filters);
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <FilterRow
          label={t("admin.filter_status")}
          allLabel={t("admin.filter_all")}
          options={FEEDBACK_STATUSES.map((value) => ({
            value,
            label: t(`status.${FEEDBACK_STATUS_KEYS[value]}`),
          }))}
          selected={filters.status}
          onSelect={(status) =>
            setFilters((prev) => ({
              ...prev,
              status: status as FeedbackStatus,
            }))
          }
        />
        <FilterRow
          label={t("admin.filter_type")}
          allLabel={t("admin.filter_all")}
          options={FEEDBACK_TYPES.map((value) => ({
            value,
            label: t(`types.${FEEDBACK_TYPE_KEYS[value]}`),
          }))}
          selected={filters.type}
          onSelect={(type) =>
            setFilters((prev) => ({ ...prev, type: type as FeedbackType }))
          }
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-stone-500">
          {t("admin.load_error")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 py-12 text-center text-sm text-stone-400">
          {t("admin.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <AdminFeedbackCard
                feedback={item}
                onEdit={() => setEditing(item)}
              />
            </li>
          ))}
        </ul>
      )}

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

      <AdminFeedbackEditDialog
        feedback={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
};

interface FilterRowProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
}

const FilterRow = ({
  label,
  allLabel,
  options,
  selected,
  onSelect,
}: FilterRowProps) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {[{ value: undefined, label: allLabel }, ...options].map((option) => (
      <button
        key={option.value ?? "all"}
        type="button"
        role="radio"
        aria-checked={selected === option.value}
        onClick={() => onSelect(option.value)}
        className={cn(
          "h-8 rounded-full border px-3 text-xs transition-colors",
          selected === option.value
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-200 bg-white text-stone-600 pointer-fine:hover:border-stone-400",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const AdminFeedbackCard = ({
  feedback,
  onEdit,
}: {
  feedback: AdminFeedback;
  onEdit: () => void;
}) => {
  const t = useTranslations("feedback");
  const locale = useLocale();

  return (
    <article className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 text-xs text-stone-500">
        <span className="flex flex-wrap items-center gap-x-1.5">
          <span className="font-semibold text-stone-900">#{feedback.id}</span>
          <span>·</span>
          <span>{formatDate(feedback.createdAt, locale, "dateTime")}</span>
          <span>·</span>
          <span>{t(`types.${FEEDBACK_TYPE_KEYS[feedback.type]}`)}</span>
          <span>·</span>
          {feedback.user ? (
            <Link
              href={PATHS.USER_PROFILE(feedback.user.handle)}
              className="underline-offset-2 hover:underline"
            >
              {feedback.user.nickname}
            </Link>
          ) : (
            <span>{t("admin.user_withdrawn")}</span>
          )}
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

      <dl className="grid grid-cols-1 gap-1 text-xs text-stone-400">
        {feedback.pagePath && (
          <div className="flex gap-2">
            <dt className="shrink-0">{t("admin.page")}</dt>
            <dd className="min-w-0 break-all">
              <a
                href={feedback.pagePath}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {safeDecode(feedback.pagePath)}
              </a>
            </dd>
          </div>
        )}
        {feedback.userAgent && (
          <div className="flex gap-2">
            <dt className="shrink-0">{t("admin.device")}</dt>
            <dd className="min-w-0 truncate" title={feedback.userAgent}>
              {feedback.userAgent}
            </dd>
          </div>
        )}
      </dl>

      {feedback.adminNote && (
        <p className="whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t("admin.note_label")}: {feedback.adminNote}
        </p>
      )}
      {feedback.reply && (
        <div className="space-y-1 rounded-xl bg-stone-50 p-3">
          <p className="text-xs font-semibold text-stone-900">
            {t("my.reply_label")}
          </p>
          <p className="whitespace-pre-wrap text-sm text-stone-700">
            {feedback.reply}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onEdit}>
          {t("admin.edit")}
        </Button>
      </div>
    </article>
  );
};
