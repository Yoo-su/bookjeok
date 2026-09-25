"use client";

import { getReadingTower } from "@bookjeok/api-client";
import { type ReadingLog, readingLogKeys } from "@bookjeok/core";
import {
  useCreateReadingLogMutation as useSharedCreateReadingLogMutation,
  useDeleteReadingLogMutation as useSharedDeleteReadingLogMutation,
  useUpdateReadingLogMutation as useSharedUpdateReadingLogMutation,
  useUpdateReadingLogSettingsMutation as useSharedUpdateReadingLogSettingsMutation,
} from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { API_ERROR_CODES, getErrorCode } from "@/shared/utils/error-handler";

import { cm1 } from "../components/tower-view/hooks/use-tower-copy";
import { useTowerPerson } from "../components/tower-view/hooks/use-tower-person";
import { towerStatus } from "../components/tower-view/lib/status";
import { useReadingLogViewStore } from "../stores/use-reading-log-view-store";

/** 같은 책·같은 날 중복은 서버가 409로 막는다. 폼은 열어 둬 날짜를 고치게 한다. */
const isDuplicateError = (error: unknown) =>
  getErrorCode(error) === API_ERROR_CODES.READING_LOG_DUPLICATE;

/**
 * 기록한 책이 책탑을 얼마나 올렸는지 알린다. 책탑을 못 받으면 평범한 완료 알림을 띄운다.
 */
function useAnnounceTowerGrowth() {
  const t = useTranslations("reading_log.toast");
  const tTower = useTranslations("reading_log.tower");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { heightCm } = useTowerPerson();
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);

  return async (log: ReadingLog) => {
    const year = Number(log.date.slice(0, 4));
    try {
      const tower = await queryClient.fetchQuery({
        queryKey: readingLogKeys.tower(year).queryKey,
        queryFn: () => getReadingTower(year),
      });
      const book = tower.items.find((b) => b.logId === log.id);
      if (!book) throw new Error("기록이 책탑에 없음");

      const userMm = heightCm * 10;
      const towerMm = tower.items.reduce((a, b) => a + b.depth, 0);
      const before = towerStatus(towerMm - book.depth, userMm);
      const after = towerStatus(towerMm, userMm);
      let description: string;
      if (after.ratio >= 1)
        description =
          before.ratio < 1
            ? t("tower_over_passed")
            : t("tower_over", { cm: after.overCm });
      else if (after.passed && after.passed !== before.passed)
        description = t("tower_passed", {
          part: tTower(`parts.${after.passed}.object`),
        });
      else
        description = t("tower_to_next", {
          part: tTower(`parts.${after.next ?? "head"}.name`),
          cm: after.toNextCm,
        });

      toast.success(t("create_tower", { cm: cm1(book.depth) }), {
        description,
        // 페이지가 올해를 열므로 지난해 기록에는 바로가기를 두지 않는다
        action:
          year === new Date().getFullYear()
            ? {
                label: t("view_tower"),
                onClick: () => {
                  setViewMode("tower");
                  router.push(PATHS.READING_LOG);
                },
              }
            : undefined,
      });
    } catch {
      toast.success(t("create_success"));
    }
  };
}

/**
 * 독서 기록 생성 뮤테이션 훅
 */
export const useCreateReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  const announce = useAnnounceTowerGrowth();
  return useSharedCreateReadingLogMutation({
    onSuccess: (log) => {
      void announce(log);
    },
    onError: (error) => {
      toast.error(
        t(isDuplicateError(error) ? "already_added" : "create_error"),
      );
    },
  });
};

/**
 * 독서 기록 수정 뮤테이션 훅
 */
export const useUpdateReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedUpdateReadingLogMutation({
    onSuccess: () => {
      toast.success(t("update_success"));
    },
    onError: (error) => {
      toast.error(
        t(isDuplicateError(error) ? "already_added" : "update_error"),
      );
    },
  });
};

/**
 * 독서 기록 삭제 뮤테이션 훅
 */
export const useDeleteReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedDeleteReadingLogMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};

/**
 * 독서 기록 설정 수정 뮤테이션 훅
 */
export const useUpdateReadingLogSettingsMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedUpdateReadingLogSettingsMutation({
    onSuccess: () => {
      toast.success(t("settings_updated"));
    },
  });
};
