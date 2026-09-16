"use client";

import { useDisputeOrderMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

import { AlertCircle, AlertTriangle } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/shadcn/dialog";
import { Label } from "@/shared/components/shadcn/label";
import { Textarea } from "@/shared/components/shadcn/textarea";

interface DisputeModalProps {
  orderId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const DisputeModal = ({
  orderId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: DisputeModalProps) => {
  const t = useTranslations("order.dispute_modal");
  const tCommon = useTranslations("common.actions");

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val);
    } else {
      setUncontrolledOpen(val);
    }
  };

  const [disputeReason, setDisputeReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const disputeOrderMutation = useDisputeOrderMutation({
    onSuccess: () => {
      toast.success(t("success"));
      setIsOpen(false);
      setDisputeReason("");
      setError(null);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || t("errors.submit_failed"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = disputeReason.trim();

    if (!trimmed) {
      setError(t("errors.reason_required"));
      return;
    }

    if (trimmed.length < 5) {
      setError(t("errors.reason_min_length"));
      return;
    }

    setError(null);
    disputeOrderMutation.mutate({
      orderId,
      payload: {
        disputeReason: trimmed,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
            <AlertTriangle className="h-6 w-6 text-stone-600 dark:text-stone-300" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-stone-900 dark:text-stone-100">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-stone-500">
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 에스크로 안내 박스 */}
          <div className="flex items-start gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3.5 text-xs text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800">
            <AlertCircle className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] text-stone-600 dark:text-stone-400">
              {t("escrow_warning")}
            </p>
          </div>

          {/* 거부 사유 입력 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dispute-reason"
              className="text-xs font-semibold text-stone-700 dark:text-stone-300"
            >
              {t("reason_label")}
            </Label>
            <Textarea
              id="dispute-reason"
              placeholder={t("reason_placeholder")}
              value={disputeReason}
              onChange={(e) => {
                setDisputeReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              maxLength={500}
              className="resize-none text-xs leading-relaxed border-stone-200 dark:border-stone-700"
              disabled={disputeOrderMutation.isPending}
            />
            <div className="flex justify-between items-center text-[11px] text-stone-400">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                <span>{t("min_length_hint")}</span>
              )}
              <span>{disputeReason.length}/500</span>
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={disputeOrderMutation.isPending}
              className="sm:flex-1 border-stone-200 dark:border-stone-700"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={disputeOrderMutation.isPending}
              className="sm:flex-1 font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900"
            >
              {disputeOrderMutation.isPending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
