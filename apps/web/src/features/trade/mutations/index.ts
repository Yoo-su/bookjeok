"use client";

import type { CompleteTradeResult, UsedBookSale } from "@bookjeok/core";
import {
  useCancelSaleReservationMutation as useSharedCancelSaleReservationMutation,
  useCompleteDirectTradeMutation as useSharedCompleteDirectTradeMutation,
  useReserveSaleMutation as useSharedReserveSaleMutation,
} from "@bookjeok/react-query";
import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { revalidateBookSale } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

interface TradeMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * 예약·취소·완료는 판매 상태 배지를 바꾸므로 판매글 상세의 ISR HTML도 비운다.
 * 공유 훅은 쿼리 캐시만 갱신하고 서버 액션을 부를 수 없다.
 */
const usePurgeSaleRoute = () => {
  const router = useRouter();
  return useCallback(
    (saleId: number) =>
      void purgeRouteCache(
        revalidateBookSale({
          saleId,
          accessToken: useAuthStore.getState().accessToken,
        }),
        () => router.refresh(),
      ),
    [router],
  );
};

/** 거래 상대 지정 (예약중 전환) */
export const useReserveSaleMutation = (
  options?: TradeMutationOptions<UsedBookSale>,
) => {
  const purgeSaleRoute = usePurgeSaleRoute();
  return useSharedReserveSaleMutation({
    onSuccess: (sale) => {
      options?.onSuccess?.(sale);
      purgeSaleRoute(sale.id);
    },
    onError: options?.onError,
  });
};

/** 거래 상대 지정 취소 */
export const useCancelSaleReservationMutation = (
  options?: TradeMutationOptions<UsedBookSale>,
) => {
  const purgeSaleRoute = usePurgeSaleRoute();
  return useSharedCancelSaleReservationMutation({
    onSuccess: (sale) => {
      options?.onSuccess?.(sale);
      purgeSaleRoute(sale.id);
    },
    onError: options?.onError,
  });
};

/** 직거래 완료 */
export const useCompleteDirectTradeMutation = (
  options?: TradeMutationOptions<CompleteTradeResult>,
) => {
  const purgeSaleRoute = usePurgeSaleRoute();
  return useSharedCompleteDirectTradeMutation({
    onSuccess: (result) => {
      options?.onSuccess?.(result);
      purgeSaleRoute(result.sale.id);
    },
    onError: options?.onError,
  });
};
