"use client";

import {
  getAvailableTradeReviewTags,
  TRADE_REVIEW_TAG_SPECS,
  TradeCompletionMethod,
  TradeReview,
  TradeReviewTag,
  TradeReviewTargetRole,
} from "@bookjeok/core";
import {
  useCreateTradeReviewMutation,
  useUpdateTradeReviewMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QuoteUpCircleIcon } from "@/shared/components/icons";
import {
  Check,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { Label } from "@/shared/components/shadcn/label";
import { Textarea } from "@/shared/components/shadcn/textarea";

interface TradeReviewModalProps {
  /** 후기를 남길 거래 완료 기록 */
  completionId: number;
  /** 상대의 역할. 내가 구매자면 상대는 SELLER */
  targetRole: TradeReviewTargetRole;
  /** 이 거래가 직거래였는지 택배 거래였는지 */
  method: TradeCompletionMethod;
  targetUserNickname?: string;
  /**
   * 이미 쓴 후기. 넘기면 수정 모드로 열립니다.
   * 후기는 삭제할 수 없고 작성 후 14일 이내에만 고칠 수 있습니다.
   */
  existingReview?: TradeReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const TradeReviewModal = ({
  completionId,
  targetRole,
  method,
  targetUserNickname,
  existingReview,
  open,
  onOpenChange,
  onSuccess,
}: TradeReviewModalProps) => {
  const t = useTranslations("order.trade_review");
  const tCommon = useTranslations("common.actions");

  // 직거래에 배송·포장 태그를, 구매자에게 "책 상태" 태그를 보여주면
  // 고를 수 없거나 뜻이 통하지 않는 항목이 된다. 거래 방식과 상대 역할에
  // 맞는 태그만 노출한다.
  const { positiveTags, negativeTags } = useMemo(() => {
    const available = getAvailableTradeReviewTags(targetRole, method);
    return {
      positiveTags: available.filter(
        (tag) => TRADE_REVIEW_TAG_SPECS[tag].sentiment === "POSITIVE",
      ),
      negativeTags: available.filter(
        (tag) => TRADE_REVIEW_TAG_SPECS[tag].sentiment === "NEGATIVE",
      ),
    };
  }, [targetRole, method]);

  const isEditMode = Boolean(existingReview);

  const [selectedTags, setSelectedTags] = useState<TradeReviewTag[]>([]);
  const [content, setContent] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // 수정 모드로 열릴 때 기존 값을 채운다. 모달이 닫혀 있는 동안 후기가
  // 갱신될 수 있으므로 열리는 시점을 기준으로 동기화한다.
  useEffect(() => {
    if (!open) return;

    setSelectedTags((existingReview?.tags as TradeReviewTag[]) ?? []);
    setContent(existingReview?.content ?? "");
    setValidationError(null);
  }, [open, existingReview]);

  const handleMutationSuccess = () => {
    toast.success(isEditMode ? t("update_success") : t("success"));
    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

  const handleMutationError = (err: Error) => {
    toast.error(err.message || t("errors.submit_failed"));
  };

  const createReviewMutation = useCreateTradeReviewMutation({
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const updateReviewMutation = useUpdateTradeReviewMutation({
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const activeMutation = isEditMode
    ? updateReviewMutation
    : createReviewMutation;

  const resetForm = () => {
    setSelectedTags([]);
    setContent("");
    setValidationError(null);
  };

  const handleTagToggle = (tag: TradeReviewTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTags.length === 0) {
      setValidationError(t("errors.tag_required"));
      return;
    }

    if (content.length > 500) {
      setValidationError(t("errors.content_max"));
      return;
    }

    if (isEditMode && existingReview) {
      updateReviewMutation.mutate({
        reviewId: existingReview.id,
        payload: {
          tags: selectedTags,
          content: content.trim(),
        },
      });
      return;
    }

    createReviewMutation.mutate({
      completionId,
      tags: selectedTags,
      content: content.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
              <QuoteUpCircleIcon className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {isEditMode ? t("modal_title_edit") : t("modal_title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-stone-500 pt-1">
            {isEditMode
              ? t("modal_desc_edit")
              : targetUserNickname
                ? t("modal_desc_with_user", {
                    nickname: targetUserNickname,
                    desc: t("modal_desc"),
                  })
                : t("modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* 1. 긍정 태그 선택 섹션 */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
              {t("positive_tags_title")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {positiveTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                        : "bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:text-stone-900"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {t(`tags.${tag}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 부정 태그 선택 섹션 */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <ThumbsDown className="h-3.5 w-3.5 text-stone-500" />
              {t("negative_tags_title")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {negativeTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-stone-100 text-stone-900 border-stone-400 font-semibold shadow-2xs dark:bg-stone-800 dark:text-stone-100 dark:border-stone-600"
                        : "bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:text-stone-900"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-stone-700 dark:text-stone-300" />
                    )}
                    {t(`tags.${tag}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 텍스트 상세 후기 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
                <MessageSquare className="h-3.5 w-3.5 text-stone-400" />
                {t("content_label")}
              </Label>
              <span className="text-[11px] text-stone-400 font-mono">
                {content.length}/500
              </span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("content_placeholder")}
              rows={3}
              maxLength={500}
              className="text-xs resize-none border-stone-200 dark:border-stone-700"
            />
          </div>

          {/* 유효성 검사 에러 표시 */}
          {validationError && (
            <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-2.5 text-xs text-destructive font-medium">
              {validationError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={activeMutation.isPending}
              className="border-stone-200 dark:border-stone-700"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={activeMutation.isPending}
              className="font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
            >
              {activeMutation.isPending
                ? t("submitting")
                : isEditMode
                  ? t("submit_edit")
                  : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
