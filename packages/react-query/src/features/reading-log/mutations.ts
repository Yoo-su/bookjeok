"use client";

import {
  createReadingLog,
  deleteReadingLog,
  sendKong,
  updateReadingLog,
  updateReadingLogSettings,
} from "@bookjeok/api-client";
import {
  CreateReadingLogParams,
  ReadingLog,
  readingLogKeys,
  SendKongResponse,
  SentKongsResponse,
  UpdateReadingLogParams,
  User,
  userKeys,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyUpdatedLog, insertLog, removeLog, yearListKey } from "./cache";

/**
 * 독서 기록 설정 수정 뮤테이션
 */
export const useUpdateReadingLogSettingsMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(isReadingLogPublic),
    onMutate: async (isReadingLogPublic) => {
      await queryClient.cancelQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      await queryClient.cancelQueries({ queryKey: userKeys.me.queryKey });

      const previousSettings = queryClient.getQueryData(
        readingLogKeys.settings.queryKey,
      );
      const previousUser = queryClient.getQueryData<User>(userKeys.me.queryKey);

      queryClient.setQueryData<{ isReadingLogPublic: boolean }>(
        readingLogKeys.settings.queryKey,
        (old) =>
          old ? { ...old, isReadingLogPublic } : { isReadingLogPublic },
      );

      if (previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, {
          ...previousUser,
          isReadingLogPublic,
        });
      }

      return { previousSettings, previousUser };
    },
    onError: (err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          readingLogKeys.settings.queryKey,
          context.previousSettings,
        );
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, context.previousUser);
      }
      options?.onError?.(err);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me.queryKey });
    },
  });
};

/**
 * 독서 기록 생성 뮤테이션
 */
export const useCreateReadingLogMutation = (options?: {
  onSuccess?: (data: ReadingLog) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<
    ReadingLog,
    Error,
    CreateReadingLogParams & { idempotencyKey?: string }
  >({
    mutationFn: ({
      idempotencyKey,
      ...payload
    }: CreateReadingLogParams & { idempotencyKey?: string }) =>
      createReadingLog(payload as CreateReadingLogParams, {
        idempotencyKey,
      }),
    onSuccess: (data) => {
      if (data.date) {
        // 캐시가 없는 해에 [data]를 심으면 그해가 한 권짜리로 먼저 그려진다.
        // 도서 상세처럼 캘린더 밖에서 기록하면 흔하다.
        queryClient.setQueryData<ReadingLog[]>(
          yearListKey(data.date),
          (old) => old && insertLog(old, data),
        );
      }
      // 동기화를 위해 백그라운드로 캐시 전체 무효화
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 수정 뮤테이션
 */
export const useUpdateReadingLogMutation = (options?: {
  onSuccess?: (data: ReadingLog) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<ReadingLog, Error, UpdateReadingLogParams>({
    mutationFn: (params: UpdateReadingLogParams) => updateReadingLog(params),
    onSuccess: (data) => {
      if (data.date) {
        // 날짜가 바뀌면 다른 해로 옮겨 갈 수 있어 모든 목록에서 빼고 새 해에만 넣는다.
        // 날짜가 같으면 제자리에서 바꿔 그날 맨 앞 표지가 바뀌지 않게 한다.
        queryClient.setQueriesData<ReadingLog[]>(
          { queryKey: readingLogKeys.list._def },
          (old) => old && applyUpdatedLog(old, data),
        );
        queryClient.setQueryData<ReadingLog[]>(
          yearListKey(data.date),
          (old) => old && insertLog(old, data),
        );
      }
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 삭제 뮤테이션
 */
export const useDeleteReadingLogMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; date: string }) =>
      deleteReadingLog(params.id),
    onSuccess: (_, variables) => {
      if (variables.date) {
        queryClient.setQueryData<ReadingLog[]>(
          yearListKey(variables.date),
          (old) => old && removeLog(old, variables.id),
        );
      }
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 콩 보내기 뮤테이션. 누르자마자 보낸 콩이 앉도록 보낸 목록에 먼저 넣고, 실패하면 되돌린다.
 * 서버는 같은 기록에 두 번 보내도 성공(sent: false)으로 답한다
 */
export const useSendKongMutation = (
  handle: string,
  options?: {
    onSuccess?: (data: SendKongResponse) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();
  const sentKey = readingLogKeys.kongsSent(handle).queryKey;

  return useMutation({
    mutationFn: (logId: string) => sendKong(logId),
    onMutate: async (logId) => {
      await queryClient.cancelQueries({ queryKey: sentKey });
      const previous = queryClient.getQueryData<SentKongsResponse>(sentKey);
      queryClient.setQueryData<SentKongsResponse>(sentKey, (old) => ({
        logIds: old?.logIds.includes(logId)
          ? old.logIds
          : [...(old?.logIds ?? []), logId],
      }));
      return { previous };
    },
    onError: (error, _logId, context) => {
      // 받기 전이었으면 비워 둔다. undefined로 set하면 무시되어 낙관적 값이 남는다
      if (context?.previous)
        queryClient.setQueryData(sentKey, context.previous);
      else queryClient.removeQueries({ queryKey: sentKey, exact: true });
      options?.onError?.(error);
    },
    onSuccess: (data) => options?.onSuccess?.(data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: sentKey }),
  });
};
