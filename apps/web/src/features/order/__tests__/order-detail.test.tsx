import { Order, OrderStatus } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { OrderDetailCard } from "../components/order-detail/order-detail-card";
import { OrderStatusTimeline } from "../components/order-detail/order-status-timeline";

const mockOrder: Order = {
  id: "ORD-20260827-00101",
  status: OrderStatus.PAID,
  amount: 25000,
  paymentKey: "toss_pay_key_999",
  recipientName: "홍길동",
  recipientPhone: "010-1234-5678",
  zipCode: "06234",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "101호",
  carrier: null,
  trackingNumber: null,
  expiresAt: null,
  paidAt: "2026-08-27T01:30:00.000Z",
  shippedAt: null,
  deliveredAt: null,
  confirmedAt: null,
  disputedAt: null,
  cancelledAt: null,
  createdAt: "2026-08-27T01:00:00.000Z",
  updatedAt: "2026-08-27T01:30:00.000Z",
  disputeReason: null,
  cancelReason: null,
  saleId: 55,
  buyerId: 2,
  sellerId: 1,
  chatRoomId: 20,
  sale: {
    id: 55,
    title: "이펙티브 타입스크립트",
    price: 25000,
    city: "서울",
    district: "강남구",
    content: "책 깨끗합니다",
    status: "RESERVED" as any,
    viewCount: 15,
    imageUrls: [],
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    user: {
      id: 1,
      nickname: "TS장인",
      handle: "ts_master",
      profileImageUrl: null,
    },
    book: {
      isbn: "9788966263134",
      title: "이펙티브 타입스크립트",
      author: "댄 밴더캄",
      image: "https://example.com/effective.jpg",
    } as any,
  },
  seller: {
    id: 1,
    nickname: "TS장인",
    handle: "ts_master",
    profileImageUrl: null,
  },
  buyer: {
    id: 2,
    nickname: "홍길동",
    handle: "gildong",
    profileImageUrl: null,
  },
};

let mockCurrentUser: any = { id: 1, nickname: "TS장인" };

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: any) => selector({ user: mockCurrentUser }),
}));

vi.mock("@bookjeok/react-query", () => ({
  useMarkRoomAsReadMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCancelSelectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmPurchaseMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelOrderMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useRegisterShippingMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDisputeOrderMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTradeReviewMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useMyTradeReviewEligibilityQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  return createIntlMock();
});

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

describe("OrderStatusTimeline", () => {
  it("renders 5 order progress steps", () => {
    renderWithQueryClient(<OrderStatusTimeline order={mockOrder} />);

    expect(screen.getByText("주문 진행 상태")).toBeInTheDocument();
    expect(screen.getByText("결제 대기")).toBeInTheDocument();
    expect(screen.getByText("결제 완료")).toBeInTheDocument();
    expect(screen.getByText("배송 중")).toBeInTheDocument();
    expect(screen.getByText("배송 완료")).toBeInTheDocument();
    expect(screen.getByText("구매 확정")).toBeInTheDocument();
  });
});

describe("OrderDetailCard", () => {
  it("renders order details, book info, shipping snapshot, and payment breakdown", () => {
    mockCurrentUser = { id: 1, nickname: "TS장인" }; // Seller
    renderWithQueryClient(<OrderDetailCard order={mockOrder} />);

    expect(screen.getByText("ORD-20260827-00101")).toBeInTheDocument();
    expect(screen.getByText("이펙티브 타입스크립트")).toBeInTheDocument();
    expect(screen.getByText(/댄 밴더캄/)).toBeInTheDocument();
    expect(
      screen.getByText(/서울특별시 강남구 테헤란로 123/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("25,000원").length).toBeGreaterThan(0);
    expect(
      screen.getByText("토스페이먼츠 에스크로 안전결제 보호 중"),
    ).toBeInTheDocument();

    expect(screen.getByText("TS장인")).toBeInTheDocument();
    expect(screen.getAllByText("홍길동").length).toBeGreaterThan(0);

    // As seller for PAID order, register shipping button should appear
    expect(
      screen.getByRole("button", { name: /운송장 등록/i }),
    ).toBeInTheDocument();
  });

  it("shows action buttons for buyer when order is delivered", () => {
    mockCurrentUser = { id: 2, nickname: "홍길동" }; // Buyer
    const deliveredOrder: Order = {
      ...mockOrder,
      status: OrderStatus.DELIVERED,
      carrier: "우체국택배",
      trackingNumber: "6012345678901",
      deliveredAt: "2026-08-27T04:00:00.000Z",
    };

    renderWithQueryClient(<OrderDetailCard order={deliveredOrder} />);

    expect(
      screen.getByRole("button", { name: /구매확정/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /문제 신고/i }),
    ).toBeInTheDocument();
  });
});
