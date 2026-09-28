"use client";

import {
  createBookSale,
  deleteBookSale,
  updateBookSale,
  updateBookSaleStatus,
} from "@bookjeok/api-client";
import {
  bookSaleKeys,
  CreateBookSaleParams,
  SaleStatus,
  UpdateBookSaleParams,
  UsedBookSale,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 중고책 판매글 생성을 위한 순수 뮤테이션 훅
 */
export const useCreateBookSaleMutation = (options?: {
  onSuccess?: (data: UsedBookSale) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...params
    }: CreateBookSaleParams & { idempotencyKey?: string }) =>
      createBookSale(params as CreateBookSaleParams, { idempotencyKey }),
    ...options,
  });
};

/**
 * 중고책 판매글 수정을 위한 순수 뮤테이션 훅
 */
export const useUpdateBookSaleMutation = (options?: {
  onSuccess?: (data: UsedBookSale) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (params: { saleId: number; payload: UpdateBookSaleParams }) =>
      updateBookSale(params),
    ...options,
  });
};

/**
 * 판매글 상태 업데이트를 위한 순수 뮤테이션 훅 (낙관적 업데이트 포함)
 */
export const useUpdateBookSaleStatusMutation = (options?: {
  onSuccess?: (data: UsedBookSale) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const queryKey = bookSaleKeys.mySales.queryKey;

  return useMutation({
    mutationFn: (params: { saleId: number; status: SaleStatus }) =>
      updateBookSaleStatus(params),
    onMutate: async ({ saleId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<UsedBookSale[]>(queryKey);

      queryClient.setQueryData<UsedBookSale[]>(queryKey, (old) =>
        old
          ? old.map((sale) => (sale.id === saleId ? { ...sale, status } : sale))
          : [],
      );

      return { previousSales };
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
    onSuccess: (data: UsedBookSale) => {
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};

/**
 * 중고책 판매글 삭제를 위한 순수 뮤테이션 훅
 */
export const useDeleteBookSaleMutation = (options?: {
  onSuccess?: (data: void, saleId: number) => void;
  onError?: (error: Error, saleId: number) => void;
}) => {
  return useMutation({
    mutationFn: (saleId: number) => deleteBookSale(saleId),
    ...options,
  });
};
