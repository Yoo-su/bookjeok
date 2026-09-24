"use client";

import {
  useReadingLogSettingsQuery,
  useReadingLogsQuery,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { useUpdateReadingLogSettingsMutation } from "../../mutations";
import { ReadingLogCardDeck } from "./reading-log-card-deck";

interface ShareDeckDialogProps {
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 공유 전에 내 연간 덱을 미리 본다. 공유 페이지는 공개 기록만 보여 준다. */
export function ShareDeckDialog({
  year,
  open,
  onOpenChange,
}: ShareDeckDialogProps) {
  const t = useTranslations("reading_log.deck");

  const { data: logs = [], isLoading } = useReadingLogsQuery(
    { year },
    { enabled: open },
  );
  const { data: settings } = useReadingLogSettingsQuery();
  const { mutate: updateSettings, isPending } =
    useUpdateReadingLogSettingsMutation();

  const isPublic = settings?.isReadingLogPublic ?? true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center font-serif text-stone-900">
            {t("dialog_title", { year })}
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500">
            {t("dialog_desc")}
          </DialogDescription>
        </DialogHeader>

        <ReadingLogCardDeck
          logs={logs}
          currentDate={new Date(year, 0, 1)}
          isLoading={isLoading}
          // 비공개면 링크를 받은 쪽에 빈 덱이 보이므로 복사 버튼을 숨긴다
          readOnly={!isPublic}
        />

        {!isPublic && logs.length > 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center">
            <p className="text-sm text-stone-600 break-keep">
              {t("private_notice")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-stone-300"
              disabled={isPending}
              onClick={() => updateSettings(true)}
            >
              {t("make_public")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
