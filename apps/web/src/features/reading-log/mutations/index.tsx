"use client";

import {
  useCreateReadingLogMutation as useSharedCreateReadingLogMutation,
  useDeleteReadingLogMutation as useSharedDeleteReadingLogMutation,
  useUpdateReadingLogMutation as useSharedUpdateReadingLogMutation,
  useUpdateReadingLogSettingsMutation as useSharedUpdateReadingLogSettingsMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { API_ERROR_CODES, getErrorCode } from "@/shared/utils/error-handler";

/** 같은 책·같은 날 중복은 서버가 409로 막는다. 폼은 열어 둬 날짜를 고치게 한다. */
const isDuplicateError = (error: unknown) =>
  getErrorCode(error) === API_ERROR_CODES.READING_LOG_DUPLICATE;

/**
 * 독서 기록 생성 뮤테이션 훅
 */
export const useCreateReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedCreateReadingLogMutation({
    onSuccess: () => {
      toast.success(t("create_success"));
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
