import { Order, OrderStatus } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyPurchasesList } from "../components/my-purchases/my-purchases-list";
import { PurchaseOrderCard } from "../components/my-purchases/purchase-order-card";

const mockOrders: Order[] = [
  {
    id: "ORD-20260827-0001",
    status: OrderStatus.AWAITING_PAYMENT,
    amount: 15000,
    paymentKey: null,
    recipientName: null,
    recipientPhone: null,
    zipCode: null,
    address: null,
    addressDetail: null,
    carrier: null,
    trackingNumber: null,
    expiresAt: "2026-08-28T00:00:00.000Z",
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    confirmedAt: null,
    disputedAt: null,
    cancelledAt: null,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    disputeReason: null,
    cancelReason: null,
    saleId: 10,
    buyerId: 2,
    sellerId: 1,
    chatRoomId: 5,
    sale: {
      id: 10,
      title: "클린 코드 (Clean Code)",
      price: 15000,
      city: "서울",
      district: "서초구",
      content: "상태 좋습니다",
      status: "RESERVED" as any,
      viewCount: 5,
      imageUrls: [],
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: "2026-08-27T00:00:00.000Z",
      user: {
        id: 1,
        nickname: "클린판매자",
        handle: "clean_seller",
        profileImageUrl: null,
      },
      book: {
        isbn: "9788966260959",
        title: "Clean Code",
        author: "로버트 C. 마틴",
        image: "https://example.com/cover.jpg",
      } as any,
    },
    seller: {
      id: 1,
      nickname: "클린판매자",
      handle: "clean_seller",
      profileImageUrl: null,
    },
  },
  {
    id: "ORD-20260827-0002",
    status: OrderStatus.DELIVERED,
    amount: 30000,
    paymentKey: "pay_test_123",
    recipientName: "홍길동",
    recipientPhone: "010-1234-5678",
    zipCode: "06234",
    address: "서울 강남구",
    addressDetail: "101호",
    carrier: "CJ대한통운",
    trackingNumber: "123456789012",
    expiresAt: null,
    paidAt: "2026-08-27T01:00:00.000Z",
    shippedAt: "2026-08-27T02:00:00.000Z",
    deliveredAt: "2026-08-27T05:00:00.000Z",
    confirmedAt: null,
    disputedAt: null,
    cancelledAt: null,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T05:00:00.000Z",
    disputeReason: null,
    cancelReason: null,
    saleId: 20,
    buyerId: 2,
    sellerId: 3,
    chatRoomId: 6,
    sale: {
      id: 20,
      title: "도메인 주도 설계",
      price: 30000,
      city: "서울",
      district: "강남구",
      content: "깨끗합니다",
      status: "RESERVED" as any,
      viewCount: 12,
      imageUrls: [],
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: "2026-08-27T00:00:00.000Z",
      user: {
        id: 3,
        nickname: "에릭에반스팬",
        handle: "ddd_fan",
        profileImageUrl: null,
      },
      book: {
        isbn: "9788992939850",
        title: "도메인 주도 설계",
        author: "에릭 에반스",
        image: "https://example.com/cover2.jpg",
      } as any,
    },
    seller: {
      id: 3,
      nickname: "에릭에반스팬",
      handle: "ddd_fan",
      profileImageUrl: null,
    },
  },
];

const queryData: any = {
  orders: mockOrders,
  total: 2,
  page: 1,
  limit: 10,
};

vi.mock("@bookjeok/react-query", () => ({
  useMarkRoomAsReadMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMyPurchasesQuery: () => ({
    data: queryData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useConfirmPurchaseMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCreateTradeReviewMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      won: "원",
      "tabs.all": "전체",
      "tabs.awaiting_payment": "결제 대기",
      "tabs.paid": "발송 대기",
      "tabs.shipped": "배송 중",
      "tabs.delivered": "배송 완료",
      "tabs.confirmed": "구매 확정",
      "tabs.cancelled_disputed": "취소/분쟁",
      empty_title: "구매한 내역이 없습니다",
      empty_desc: "북적 북마켓에서 마음에 드는 책을 찾아보세요!",
      btn_browse_market: "북마켓 둘러보기",
      seller: "판매자",
      view_detail: "주문 상세",
      btn_pay: "결제하기",
      btn_confirm: "구매확정",
      btn_chat: "채팅하기",
    };
    return map[key] || key;
  },
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/features/confirm", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

/** useOpenChatRoom이 캐시를 직접 다루므로 카드 렌더링에 QueryClient가 필요 */
const renderWithQueryClient = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

describe("PurchaseOrderCard", () => {
  it("renders order information and status badge", () => {
    renderWithQueryClient(<PurchaseOrderCard order={mockOrders[0]} />);

    expect(screen.getByText("클린 코드 (Clean Code)")).toBeInTheDocument();
    expect(screen.getByText("ORD-20260827-0001")).toBeInTheDocument();
    expect(screen.getByText("15,000원")).toBeInTheDocument();
    expect(screen.getByText("결제 대기")).toBeInTheDocument();
    expect(screen.getByText("결제하기")).toBeInTheDocument();
  });

  it("renders delivery info and confirm purchase button for delivered order", () => {
    renderWithQueryClient(<PurchaseOrderCard order={mockOrders[1]} />);

    expect(screen.getByText("도메인 주도 설계")).toBeInTheDocument();
    expect(screen.getByText("CJ대한통운 123456789012")).toBeInTheDocument();
    expect(screen.getByText("배송 완료")).toBeInTheDocument();
    expect(screen.getByText("구매확정")).toBeInTheDocument();
  });
});

describe("MyPurchasesList", () => {
  it("renders filter tabs and orders list", () => {
    renderWithQueryClient(<MyPurchasesList />);

    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "결제 대기" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "배송 중" })).toBeInTheDocument();
    expect(screen.getByText("클린 코드 (Clean Code)")).toBeInTheDocument();
    expect(screen.getByText("도메인 주도 설계")).toBeInTheDocument();
  });
});
