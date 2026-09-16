import { Order, OrderStatus } from "@bookjeok/core";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EscrowInfoCard } from "../components/escrow-info-card";
import { PaymentSummary } from "../components/payment-summary";
import {
  clearPendingOrderShipping,
  getPendingOrderShipping,
  PendingOrderShipping,
  savePendingOrderShipping,
} from "../utils/order-storage";

vi.mock("next-intl", async () => {
  const { createIntlMock } = await import("@/__tests__/helpers/intl");
  return createIntlMock();
});

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="mock-next-image" />
  ),
}));

describe("Order Storage Utilities", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  const mockShipping: PendingOrderShipping = {
    orderId: "ORD-20260827-00101",
    recipientName: "김북적",
    recipientPhone: "010-1111-2222",
    zipCode: "06234",
    address: "서울시 강남구 테헤란로 123",
    addressDetail: "101호",
    deliveryMemo: "배송 전 연락바랍니다",
    savedAt: Date.now(),
  };

  it("saves and retrieves pending order shipping by orderId", () => {
    savePendingOrderShipping(mockShipping);

    const retrievedById = getPendingOrderShipping("ORD-20260827-00101");
    expect(retrievedById).toEqual(mockShipping);
  });

  it("retrieves pending order shipping from localStorage if sessionStorage is cleared (mobile redirect defense)", () => {
    savePendingOrderShipping(mockShipping);

    // 모바일 리디렉션/새 탭 상황 모사 (sessionStorage 비워짐)
    sessionStorage.clear();

    const retrievedFromLocal = getPendingOrderShipping("ORD-20260827-00101");
    expect(retrievedFromLocal).toEqual(mockShipping);
  });

  it("clears pending order shipping properly from both storages", () => {
    savePendingOrderShipping(mockShipping);
    expect(getPendingOrderShipping("ORD-20260827-00101")).not.toBeNull();

    clearPendingOrderShipping("ORD-20260827-00101");
    expect(getPendingOrderShipping("ORD-20260827-00101")).toBeNull();
  });
});

describe("PaymentSummary Component", () => {
  const mockOrder: Order = {
    id: "ORD-20260827-00101",
    status: OrderStatus.AWAITING_PAYMENT,
    amount: 25000,
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
    saleId: 50,
    buyerId: 2,
    sellerId: 1,
    chatRoomId: 10,
    sale: {
      id: 50,
      title: "리팩터링 2판 (마틴 파울러)",
      price: 25000,
      city: "서울",
      district: "강남구",
      content: "깨끗하게 본 책입니다.",
      status: "RESERVED" as any,
      viewCount: 10,
      imageUrls: ["https://example.com/refactoring.jpg"],
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: "2026-08-27T00:00:00.000Z",
      user: {
        id: 1,
        nickname: "클린코드판매자",
        handle: "clean_seller",
        profileImageUrl: null,
      },
      book: {
        isbn: "9791162242742",
        title: "리팩터링 2판",
        author: "마틴 파울러",
        image: "https://example.com/cover.jpg",
      } as any,
    },
    seller: {
      id: 1,
      nickname: "클린코드판매자",
      handle: "clean_seller",
      profileImageUrl: null,
    },
  };

  it("renders order information and amounts correctly", () => {
    render(<PaymentSummary order={mockOrder} />);

    expect(screen.getByText("리팩터링 2판 (마틴 파울러)")).toBeInTheDocument();
    expect(screen.getByText("마틴 파울러")).toBeInTheDocument();
    expect(screen.getByText("클린코드판매자")).toBeInTheDocument();
    expect(screen.getByText("ORD-20260827-00101")).toBeInTheDocument();
    expect(screen.getByText("무료배송")).toBeInTheDocument();
    expect(
      screen.getByText("토스페이먼츠 에스크로 안전결제"),
    ).toBeInTheDocument();
  });
});

describe("EscrowInfoCard Component", () => {
  it("renders 4 escrow process steps", () => {
    render(<EscrowInfoCard />);

    expect(screen.getByText("1. 대금 안전 보관")).toBeInTheDocument();
    expect(screen.getByText("2. 안전 택배 발송")).toBeInTheDocument();
    expect(screen.getByText("3. 도서 수령 및 검수")).toBeInTheDocument();
    expect(screen.getByText("4. 구매확정 및 정산")).toBeInTheDocument();
  });
});
