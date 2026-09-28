"use client";

import {
  FEEDBACK_BOOK_FIELD_MAX_LENGTH,
  FEEDBACK_CONTENT_MAX_LENGTH,
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_PAGE_PATH_MAX_LENGTH,
  FeedbackType,
} from "@bookjeok/core";
import { useCreateFeedbackMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { Input } from "@/shared/components/shadcn/input";
import { Label } from "@/shared/components/shadcn/label";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { cn } from "@/shared/utils/cn";
import { API_ERROR_CODES, getErrorCode } from "@/shared/utils/error-handler";

import { FEEDBACK_TYPE_KEYS, FEEDBACK_TYPES } from "../../constants";
import {
  FeedbackPreset,
  useFeedbackDialogStore,
} from "../../stores/use-feedback-dialog-store";

/**
 * 문의·제보 창. DefaultLayout에 하나만 두고 스토어로 연다
 */
export const FeedbackDialog = () => {
  const t = useTranslations("feedback");
  const isOpen = useFeedbackDialogStore((state) => state.isOpen);
  const preset = useFeedbackDialogStore((state) => state.preset);
  const session = useFeedbackDialogStore((state) => state.session);
  const close = useFeedbackDialogStore((state) => state.close);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {/* 짧은 화면·키보드가 올라온 모바일에서 보내기 버튼이 밀려나지 않게 창 안에서 스크롤 */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <FeedbackForm key={session} preset={preset} onDone={close} />
      </DialogContent>
    </Dialog>
  );
};

interface FeedbackFormProps {
  preset: FeedbackPreset | null;
  onDone: () => void;
}

const FeedbackForm = ({ preset, onDone }: FeedbackFormProps) => {
  const t = useTranslations("feedback");
  const [type, setType] = useState<FeedbackType>(
    preset?.type ?? FeedbackType.BOOK_REQUEST,
  );
  const [bookTitle, setBookTitle] = useState(preset?.bookTitle ?? "");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [content, setContent] = useState("");

  const createFeedback = useCreateFeedbackMutation({
    onSuccess: () => {
      toast.success(t("success"));
      onDone();
    },
    onError: (error) => {
      toast.error(
        getErrorCode(error) === API_ERROR_CODES.FEEDBACK_DAILY_LIMIT_EXCEEDED
          ? t("daily_limit", { limit: FEEDBACK_DAILY_LIMIT })
          : t("error"),
      );
    },
  });

  const isBookRequest = type === FeedbackType.BOOK_REQUEST;
  const canSubmit = isBookRequest
    ? bookTitle.trim().length > 0
    : content.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || createFeedback.isPending) return;

    const pagePath = `${window.location.pathname}${window.location.search}`;
    createFeedback.mutate({
      type,
      content: content.trim() || undefined,
      ...(isBookRequest && {
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || undefined,
        bookPublisher: bookPublisher.trim() || undefined,
      }),
      pagePath: pagePath.slice(0, FEEDBACK_PAGE_PATH_MAX_LENGTH),
    });
  };

  const typeKey = FEEDBACK_TYPE_KEYS[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="radiogroup"
        aria-label={t("type_label")}
        className="flex flex-wrap gap-2"
      >
        {FEEDBACK_TYPES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={type === value}
            onClick={() => setType(value)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-sm transition-colors",
              type === value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 text-stone-600 pointer-fine:hover:border-stone-400",
            )}
          >
            {t(`types.${FEEDBACK_TYPE_KEYS[value]}`)}
          </button>
        ))}
      </div>

      {isBookRequest && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="feedback-book-title">{t("book_title")}</Label>
            <Input
              id="feedback-book-title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={t("book_title_placeholder")}
              maxLength={FEEDBACK_BOOK_FIELD_MAX_LENGTH}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-book-author">{t("book_author")}</Label>
              <Input
                id="feedback-book-author"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder={t("optional")}
                maxLength={FEEDBACK_BOOK_FIELD_MAX_LENGTH}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-book-publisher">
                {t("book_publisher")}
              </Label>
              <Input
                id="feedback-book-publisher"
                value={bookPublisher}
                onChange={(e) => setBookPublisher(e.target.value)}
                placeholder={t("optional")}
                maxLength={FEEDBACK_BOOK_FIELD_MAX_LENGTH}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="feedback-content">
          {isBookRequest ? t("content_label_optional") : t("content_label")}
        </Label>
        <Textarea
          id="feedback-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t(`placeholders.${typeKey}`)}
          maxLength={FEEDBACK_CONTENT_MAX_LENGTH}
          rows={5}
          className="resize-none"
        />
        <p className="text-right text-xs text-stone-400">
          {content.length}/{FEEDBACK_CONTENT_MAX_LENGTH}
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={!canSubmit || createFeedback.isPending}>
          {createFeedback.isPending ? t("submitting") : t("submit")}
        </Button>
      </DialogFooter>
    </form>
  );
};
