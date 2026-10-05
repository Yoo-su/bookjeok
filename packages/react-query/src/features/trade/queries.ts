"use client";

import {
  getMyTradeCompletions,
  getMyTradeReviewEligibility,
  getSellerStats,
  getTradeCandidates,
  getTradeCompletion,
  getTradeCompletionByRoom,
  getUserTradeReviews,
} from "@bookjeok/api-client";
import {
  CACHE_TIME,
  QueryMyCompletionsParams,
  QueryTradeReviewParams,
  tradeKeys,
  tradeReviewKeys,
} from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";

/**
 * 내 거래 내역 조회.
 *
 * 직거래는 주문 기록이 없어 주문 목록에 잡히지 않으므로, 후기를 남길 수 있는
 * 유일한 목록 화면입니다.
 */
export const useMyTradeCompletionsQuery = (
  params?: QueryMyCompletionsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeKeys.myCompletions(params).queryKey,
    queryFn: () => getMyTradeCompletions(params),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
};

/**
 * 채팅방에서 성사된 거래 완료 기록 조회.
 *
 * 주문 폴링과 달리 완료는 한 번 생기면 바뀌지 않으므로 폴링하지 않습니다.
 * 완료 직후 갱신은 로컬 뮤테이션과 원격 거래 메시지의 공통 캐시 정책이 담당합니다.
 */
export const useTradeCompletionByRoomQuery = (
  roomId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeKeys.completionByRoom(roomId ?? 0).queryKey,
    queryFn: () => getTradeCompletionByRoom(roomId as number),
    enabled: Boolean(roomId) && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  });
};

/**
 * 거래 완료 기록 상세 조회 (거래 당사자 전용)
 */
export const useTradeCompletionQuery = (
  completionId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeKeys.completionDetail(completionId ?? 0).queryKey,
    queryFn: () => getTradeCompletion(completionId as number),
    enabled: Boolean(completionId) && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
};

/**
 * 거래 상대 후보 목록 조회.
 *
 * 판매완료 모달을 열 때만 필요하므로 기본은 비활성이며,
 * 호출부에서 `enabled`로 켭니다.
 */
export const useTradeCandidatesQuery = (
  saleId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeKeys.candidates(saleId ?? 0).queryKey,
    queryFn: () => getTradeCandidates(saleId as number),
    enabled: Boolean(saleId) && (options?.enabled ?? false),
    staleTime: 30 * 1000,
  });
};

/**
 * 판매자 거래 후기 목록 조회
 */
export const useUserTradeReviewsQuery = (
  handle: string,
  params?: QueryTradeReviewParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeReviewKeys.userReviews(handle, params).queryKey,
    queryFn: () => getUserTradeReviews(handle, params),
    enabled: !!handle && (options?.enabled ?? true),
    staleTime: CACHE_TIME.ONE_MINUTE,
  });
};

/**
 * 판매자 거래 통계 및 신뢰 지표 조회 (5분 캐시)
 */
export const useSellerStatsQuery = (
  handle: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeReviewKeys.sellerStats(handle).queryKey,
    queryFn: () => getSellerStats(handle),
    enabled: !!handle && (options?.enabled ?? true),
    staleTime: CACHE_TIME.FIVE_MINUTES,
  });
};

/**
 * 이 거래에 대해 내가 후기를 쓸 수 있는지 조회.
 */
export const useMyTradeReviewEligibilityQuery = (
  completionId?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: tradeReviewKeys.eligibility(completionId ?? 0).queryKey,
    queryFn: () => getMyTradeReviewEligibility(completionId as number),
    enabled: Boolean(completionId) && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  });
};
