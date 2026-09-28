"use client";

import {
  AdminFeedback,
  FEEDBACK_ADMIN_NOTE_MAX_LENGTH,
  FEEDBACK_REPLY_MAX_LENGTH,
  FeedbackStatus,
} from "@bookjeok/core";
import { useUpdateFeedbackMutation } from "@bookjeok/react-query";
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
import { Label } from "@/shared/components/shadcn/label";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { cn } from "@/shared/utils/cn";

import { FEEDBACK_STATUS_KEYS, FEEDBACK_STATUSES } from "../../constants";

interface AdminFeedbackEditDialogProps {
  feedback: AdminFeedback | null;
  onClose: () => void;
}

/**
 * 운영자 처리 창. 상태·답변·메모를 한 번에 저장한다
 */
export const AdminFeedbackEditDialog = ({
  feedback,
  onClose,
}: AdminFeedbackEditDialogProps) => {
  const t = useTranslations("feedback.admin");
  return (
    <Dialog open={!!feedback} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("edit_title", { id: feedback?.id ?? 0 })}
          </DialogTitle>
          <DialogDescription>{t("edit_desc")}</DialogDescription>
        </DialogHeader>
        {feedback && (
          <EditForm key={feedback.id} feedback={feedback} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditForm = ({
  feedback,
  onDone,
}: {
  feedback: AdminFeedback;
  onDone: () => void;
}) => {
  const t = useTranslations("feedback");
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [reply, setReply] = useState(feedback.reply ?? "");
  const [adminNote, setAdminNote] = useState(feedback.adminNote ?? "");

  const update = useUpdateFeedbackMutation({
    onSuccess: () => {
      toast.success(t("admin.saved"));
      onDone();
    },
    onError: () => toast.error(t("admin.save_error")),
  });

  const trimmedReply = reply.trim();
  const willNotify =
    trimmedReply.length > 0 && trimmedReply !== (feedback.reply ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (update.isPending) return;
    update.mutate({ id: feedback.id, status, reply, adminNote });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="radiogroup"
        aria-label={t("admin.status_label")}
        className="flex flex-wrap gap-2"
      >
        {FEEDBACK_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={status === value}
            onClick={() => setStatus(value)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-sm transition-colors",
              status === value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 text-stone-600 pointer-fine:hover:border-stone-400",
            )}
          >
            {t(`status.${FEEDBACK_STATUS_KEYS[value]}`)}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-reply">{t("admin.reply_label")}</Label>
        <Textarea
          id="feedback-reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t("admin.reply_placeholder")}
          maxLength={FEEDBACK_REPLY_MAX_LENGTH}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-stone-500">
          {feedback.user === null
            ? t("admin.reply_no_user")
            : willNotify
              ? t("admin.reply_will_notify")
              : t("admin.reply_help")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-admin-note">{t("admin.note_label")}</Label>
        <Textarea
          id="feedback-admin-note"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder={t("admin.note_placeholder")}
          maxLength={FEEDBACK_ADMIN_NOTE_MAX_LENGTH}
          rows={2}
          className="resize-none"
        />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? t("admin.saving") : t("admin.save")}
        </Button>
      </DialogFooter>
    </form>
  );
};
