import { Order, OrderStatus } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { MySalesOrdersList } from "../components/my-sales-orders/my-sales-orders-list";
import { SalesOrderCard } from "../components/my-sales-orders/sales-order-card";

const mockSalesOrders: Order[] = [
  {
    id: "ORD-20260827-0011",
    status: OrderStatus.PAID,
    amount: 22000,
    paymentKey: "pay_key_11",
    recipientName: "이구매",
    recipientPhone: "010-9999-8888",
    zipCode: "06234",
    address: "서울 서초구 반포대로 1",
    addressDetail: "202호",
    carrier: null,
    trackingNumber: null,
    expiresAt: null,
    paidAt: "2026-08-27T02:00:00.000Z",
    shippedAt: null,
    deliveredAt: null,
    confirmedAt: null,
    disputedAt: null,
    cancelledAt: null,
    createdAt: "2026-08-27T01:00:00.000Z",
    updatedAt: "2026-08-27T02:00:00.000Z",
    disputeReason: null,
    cancelReason: null,
    saleId: 30,
    buyerId: 5,
    sellerId: 1,
    chatRoomId: 12,
    sale: {
      id: 30,
      title: "Real MySQL 8.0 1권",
      price: 22000,
      city: "서울",
      district: "서초구",
      content: "새 책 수준입니다",
      status: "RESERVED" as any,
      viewCount: 20,
      imageUrls: [],
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: "2026-08-27T00:00:00.000Z",
      user: {
        id: 1,
        nickname: "나판매자",
        handle: "my_seller",
        profileImageUrl: null,
      },
      book: {
        isbn: "9791158392703",
        title: "Real MySQL 8.0 1권",
        author: "백은빈",
        image: "https://example.com/mysql.jpg",
      } as any,
    },
    buyer: {
      id: 5,
      nickname: "이구매",
      handle: "buyer_lee",
      profileImageUrl: null,
    },
  },
];

vi.mock("@bookjeok/react-query", () => ({
  useMarkRoomAsReadMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMySalesOrdersQuery: () => ({
    data: {
      orders: mockSalesOrders,
      total: 1,
      page: 1,
      limit: 10,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCancelSelectionMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRegisterShippingMutation: () => ({
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
      "tabs.paid": "발송 요청",
      "tabs.shipped": "배송 중",
      "tabs.delivered": "배송 완료",
      "tabs.confirmed": "거래 완료",
      "tabs.cancelled_disputed": "취소/분쟁",
      empty_title: "판매 주문이 없습니다",
      empty_desc: "채팅방에서 구매 희망자를 거래 상대로 지정해보세요.",
      buyer: "구매자",
      shipping_to: "배송지",
      view_detail: "주문 상세",
      btn_ship: "운송장 등록",
      btn_cancel_selection: "지정 취소",
      btn_chat: "채팅하기",
      title: "운송장 번호 등록",
      desc: "운송장 등록 안내",
      carrier_label: "택배사",
      carrier_placeholder: "택배사 선택",
      tracking_label: "운송장 번호",
      tracking_placeholder: "운송장 번호 입력",
      submit: "등록 완료",
      submitting: "등록 중...",
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

describe("SalesOrderCard", () => {
  it("renders sales order info, buyer info and register shipping button", () => {
    renderWithQueryClient(<SalesOrderCard order={mockSalesOrders[0]} />);

    expect(screen.getByText("Real MySQL 8.0 1권")).toBeInTheDocument();
    expect(screen.getByText("ORD-20260827-0011")).toBeInTheDocument();
    expect(screen.getByText("22,000원")).toBeInTheDocument();
    expect(screen.getByText("발송 요청")).toBeInTheDocument();
    expect(screen.getAllByText(/이구매/).length).toBeGreaterThan(0);
    expect(screen.getByText("운송장 등록")).toBeInTheDocument();
  });
});

describe("MySalesOrdersList", () => {
  it("renders filter tabs and sales order list", () => {
    renderWithQueryClient(<MySalesOrdersList />);

    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "발송 요청" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Real MySQL 8.0 1권")).toBeInTheDocument();
  });
});
