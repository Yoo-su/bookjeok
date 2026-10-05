import { SaleAuthor, UsedBookSale } from "../book-sale/types";
import { TradeReviewTag, TradeReviewTargetRole } from "./review-tags";

/**
 * 거래가 어떤 방식으로 성사됐는지.
 *
 * 신뢰 지표에서 두 경로를 구분해 보여주기 위해 남깁니다. 직거래 완료는
 * 판매자의 자기신고이고, 택배 거래 완료는 에스크로 구매확정을 거친
 * 검증된 기록입니다.
 */
export enum TradeCompletionMethod {
  /** 채팅으로 약속을 잡고 직접 만나 거래 (결제 없음) */
  DIRECT = "DIRECT",
  /** 에스크로 결제 + 택배 배송 거래 */
  DELIVERY = "DELIVERY",
}

/**
 * "거래가 성사됐다"는 사실. 거래 후기는 결제(Order)가 아니라 여기에 붙습니다.
 */
export interface TradeCompletion {
  id: number;
  saleId: number;
  sale?: UsedBookSale;
  sellerId: number;
  seller?: SaleAuthor;
  buyerId: number;
  buyer?: SaleAuthor;
  chatRoomId: number | null;
  method: TradeCompletionMethod;
  /** 택배 거래일 때만 존재. 직거래는 null */
  orderId: string | null;
  completedAt: string;
  createdAt: string;
  updatedAt: string;

  // ---- 내 거래 내역 응답에만 실리는 필드 ----
  /** 이 거래에서 나의 역할 */
  myRole?: TradeReviewTargetRole;
  /** 나의 반대편 당사자 */
  counterparty?: SaleAuthor;
  /** 내가 이미 쓴 후기 (없으면 null) */
  myReview?: TradeReview | null;
  /** 지금 후기를 쓸 수 있는지 (미작성 + 기한 내) */
  canWriteReview?: boolean;
  /** 후기 작성 기한 (ISO 8601) */
  reviewExpiresAt?: string | null;
}

/** 거래 상대 지정(예약중 전환) 요청 */
export interface ReserveSaleParams {
  saleId: number;
  buyerId: number;
  chatRoomId?: number;
}

/** 직거래 완료 처리 요청 */
export interface CompleteTradeParams {
  saleId: number;
  /** 생략하면 예약 상대를 사용. 예약 상대도 없으면 후기가 열리지 않습니다 */
  buyerId?: number;
  chatRoomId?: number;
  /** 예약 상대가 있더라도 상대를 지정하지 않고 완료할 때 true */
  withoutCounterparty?: boolean;
}

/** 직거래 완료 처리 응답 */
export interface CompleteTradeResult {
  sale: UsedBookSale;
  completion: TradeCompletion | null;
}

/** 마이페이지에서 거래 상대를 고를 때 쓰는 후보 (판매글로 대화한 사람) */
export interface TradeCandidate {
  user: SaleAuthor;
  chatRoomId: number;
}

/**
 * 거래 후기.
 *
 * 결제(Order)가 아니라 거래 완료(TradeCompletion)에 붙습니다. 그래야 결제를
 * 거치지 않는 직거래에서도 후기를 남길 수 있습니다. 한 거래당 양쪽이 각각
 * 한 건씩 쓸 수 있습니다.
 */
export interface TradeReview {
  id: number;
  completionId: number;
  completion?: TradeCompletion;
  reviewerId: number;
  reviewer?: SaleAuthor;
  targetUserId: number;
  targetUser?: SaleAuthor;
  tags: TradeReviewTag[];
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 사용자의 거래 통계와 신뢰 지표.
 *
 * 직거래 완료는 판매자의 자기신고이고 택배 거래 완료는 에스크로 구매확정을
 * 거친 기록이라 신뢰도가 다릅니다. 합쳐서 보여주면 그 차이가 가려지므로
 * 건수를 나눠서 제공합니다.
 */
export interface SellerTradeStats {
  /** 직거래 + 택배 거래 완료 합계 */
  totalCompletedSales: number;
  /** 판매자 자기신고로 완료된 직거래 건수 */
  directCompletedSales: number;
  /** 에스크로 구매확정을 거친 택배 거래 건수 */
  deliveryCompletedSales: number;
  totalReviews: number;
  /** 0 ~ 100 (%) */
  positiveRate: number;
  tagCounts: Record<string, number>;
}

/** 거래 후기 작성 파라미터 */
export interface CreateTradeReviewParams {
  completionId: number;
  tags: TradeReviewTag[];
  content?: string;
}

/** 거래 후기 수정 파라미터 */
export interface UpdateTradeReviewParams {
  tags?: TradeReviewTag[];
  content?: string;
}

/** 거래 후기 목록 조회 쿼리 파라미터 */
export interface QueryTradeReviewParams {
  page?: number;
  limit?: number;
}

/** 거래 후기 목록 조회 응답 */
export interface GetTradeReviewsResponse {
  reviews: TradeReview[];
  total: number;
  page: number;
  limit: number;
}

/** 내가 이 거래에 대해 쓸 수 있는 후기 상태 */
export interface TradeReviewEligibility {
  canWrite: boolean;
  /** 이미 쓴 후기 (있으면 수정 가능) */
  myReview: TradeReview | null;
  /** 후기 작성 기한 (ISO 8601) */
  expiresAt: string | null;
}

/** 내 거래 내역 조회 필터 */
export type TradeRoleFilter = "ALL" | "BUYER" | "SELLER";

export interface QueryMyCompletionsParams {
  role?: TradeRoleFilter;
  page?: number;
  limit?: number;
}

export interface GetMyCompletionsResponse {
  completions: TradeCompletion[];
  total: number;
  page: number;
  limit: number;
}
