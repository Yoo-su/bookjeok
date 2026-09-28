"use client";
import { createFeedback, updateFeedback } from "@bookjeok/api-client";
import {
  AdminFeedback,
  CreateFeedbackParams,
  CreateFeedbackResponse,
  feedbackKeys,
  UpdateFeedbackParams,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 문의·제보 전송 뮤테이션 훅
 */
export const useCreateFeedbackMutation = (options?: {
  onSuccess?: (data: CreateFeedbackResponse) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateFeedbackParams) => createFeedback(params),
    onSuccess: (data) => {
      // 내 문의 목록이 열려 있었다면 방금 보낸 것이 보이게
      void queryClient.invalidateQueries({
        queryKey: feedbackKeys.my.queryKey,
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 운영자: 문의 처리 뮤테이션 훅
 */
export const useUpdateFeedbackMutation = (options?: {
  onSuccess?: (data: AdminFeedback) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...params }: UpdateFeedbackParams & { id: number }) =>
      updateFeedback(id, params),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: feedbackKeys.admin._def,
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};
