import { Order, OrderStatus } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import enMessages from "@/shared/i18n/messages/en.json";

import { EscrowInfoCard } from "../components/escrow-info-card";
import { PurchaseOrderCard } from "../components/my-purchases/purchase-order-card";
import { SalesOrderCard } from "../components/my-sales-orders/sales-order-card";
import { OrderDetailCard } from "../components/order-detail/order-detail-card";
import { OrderStatusTimeline } from "../components/order-detail/order-status-timeline";

/**
 * 영문 화면에 한글이 새어 나오는지 잡는 테스트라 **픽스처는 전부 영문**입니다.
 * 한글 도서 제목·닉네임을 넣으면 사용자 데이터인지 UI 카피인지 구분할 수 없습니다.
 */
const mockOrder: Order = {
  id: "ORD-20260916-00001",
  status: OrderStatus.SHIPPED,
  amount: 25000,
  paymentKey: "toss_pay_key_001",
  recipientName: "John Doe",
  recipientPhone: "010-1234-5678",
  zipCode: "06234",
  address: "123 Teheran-ro, Gangnam-gu, Seoul",
  addressDetail: "Unit 101",
  carrier: "CJ",
  trackingNumber: "123456789012",
  expiresAt: null,
  paidAt: "2026-09-16T01:30:00.000Z",
  shippedAt: "2026-09-16T05:00:00.000Z",
  deliveredAt: null,
  confirmedAt: null,
  disputedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-16T01:00:00.000Z",
  updatedAt: "2026-09-16T05:00:00.000Z",
  disputeReason: null,
  cancelReason: null,
  saleId: 55,
  buyerId: 2,
  sellerId: 1,
  chatRoomId: 20,
  sale: {
    id: 55,
    title: "Effective TypeScript",
    price: 25000,
    city: "Seoul",
    district: "Gangnam-gu",
    content: "Like new",
    status: "RESERVED" as never,
    viewCount: 15,
    imageUrls: [],
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
    user: {
      id: 1,
      nickname: "tsmith",
      handle: "tsmith",
      profileImageUrl: null,
    },
    book: {
      isbn: "9788966263134",
      title: "Effective TypeScript",
      author: "Dan Vanderkam",
      image: "https://example.com/effective.jpg",
    } as never,
  },
  seller: {
    id: 1,
    nickname: "tsmith",
    handle: "tsmith",
    profileImageUrl: null,
  },
  buyer: { id: 2, nickname: "jdoe", handle: "jdoe", profileImageUrl: null },
};

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 1, nickname: "tsmith" } }),
}));

vi.mock("@bookjeok/react-query", () => ({
  useMarkRoomAsReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelSelectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmPurchaseMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelOrderMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useRegisterShippingMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDisputeOrderMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTradeReviewMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useMyTradeReviewEligibilityQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/features/confirm", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

const renderInEnglish = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );

const statuses = [
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CONFIRMED,
  OrderStatus.DISPUTED,
  OrderStatus.CANCELLED,
];

describe("주문 화면 영문 로케일", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  // 두 번째 값은 "영문 카피가 실제로 그려졌다"는 증거. 빈 렌더가 통과하는 것을 막는다
  it.each([
    [
      "OrderStatusTimeline",
      <OrderStatusTimeline order={mockOrder} key="t" />,
      "Order Progress Timeline",
    ],
    [
      "OrderDetailCard",
      <OrderDetailCard order={mockOrder} key="d" />,
      "Total paid",
    ],
    [
      "PurchaseOrderCard",
      <PurchaseOrderCard order={mockOrder} key="p" />,
      "Paid:",
    ],
    ["SalesOrderCard", <SalesOrderCard order={mockOrder} key="s" />, "Payout:"],
    [
      "EscrowInfoCard",
      <EscrowInfoCard key="e" />,
      "Bookjeok escrow protection",
    ],
  ])("%s에 한글이 남지 않는다", (_name, ui, expectedCopy) => {
    const { container } = renderInEnglish(ui);
    const text = container.textContent ?? "";

    expect(text).toContain(expectedCopy);
    expect(text).not.toMatch(/[가-힣]/);
  });

  it("주문 상태 뱃지가 상태별로 모두 영문이다", () => {
    for (const status of statuses) {
      const { container } = renderInEnglish(
        <PurchaseOrderCard order={{ ...mockOrder, status }} />,
      );

      expect(container.textContent ?? "").not.toMatch(/[가-힣]/);
      document.body.innerHTML = "";
    }
  });
});
