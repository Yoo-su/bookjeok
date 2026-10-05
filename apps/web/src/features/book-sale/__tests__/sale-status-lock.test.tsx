import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SaleStatusSelect } from "@/features/book-sale/components/common/sale-status-select";
import { TradeCounterpartyModal } from "@/features/book-sale/components/common/trade-counterparty-modal";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

const mockUpdateStatus = vi.fn();

vi.mock("@/features/book-sale/mutations", () => ({
  useUpdateBookSaleStatusMutation: () => ({
    mutate: mockUpdateStatus,
    isPending: false,
  }),
}));

const mockReserve = vi.fn();
const mockComplete = vi.fn();

vi.mock("@/features/trade/mutations", () => ({
  useCompleteDirectTradeMutation: () => ({
    mutate: mockComplete,
    isPending: false,
  }),
  useReserveSaleMutation: () => ({ mutate: mockReserve, isPending: false }),
  useCancelSaleReservationMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@bookjeok/react-query", () => ({
  useTradeCandidatesQuery: () => ({
    data: [
      {
        user: {
          id: 42,
          handle: "buyer",
          nickname: "구매희망자",
          profileImageUrl: null,
        },
        chatRoomId: 7,
      },
    ],
    isLoading: false,
  }),
}));

const baseSale = {
  id: 1,
  title: "클린 코드 팝니다",
  price: 15000,
  city: "서울",
  district: "강남구",
  content: "상태 좋아요",
  imageUrls: [],
  status: SaleStatus.RESERVED,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  user: { id: 1, handle: "seller", nickname: "판매자", profileImageUrl: null },
  viewCount: 0,
} as unknown as UsedBookSale;

const renderSelect = (sale: UsedBookSale) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SaleStatusSelect sale={sale} />
    </QueryClientProvider>,
  );

describe("판매글 상태 변경 잠금", () => {
  it("직거래로 예약중인 판매글은 상태를 계속 바꿀 수 있다", () => {
    // 직거래 판매자는 다른 구매희망자의 혼동을 줄이려고 예약중으로 바꾼다.
    // 여기서 잠기면 판매완료로 넘어갈 방법이 없어진다.
    renderSelect({ ...baseSale, hasActiveOrder: false });

    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });

  it("활성 주문이 걸린 판매글만 상태 변경이 잠긴다", () => {
    renderSelect({ ...baseSale, hasActiveOrder: true });

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("거래 기록이 남은 판매완료는 상태를 되돌릴 수 없다", () => {
    // 되돌리면 후기와 신뢰 지표가 성사되지 않은 거래 위에 남는다.
    renderSelect({
      ...baseSale,
      status: SaleStatus.SOLD,
      hasTradeCompletion: true,
    });

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("거래 기록 없는 판매완료는 오조작일 수 있으므로 되돌릴 수 있다", () => {
    renderSelect({
      ...baseSale,
      status: SaleStatus.SOLD,
      hasTradeCompletion: false,
    });

    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });

  it("잠금 정보가 없는 응답은 잠그지 않는다", () => {
    renderSelect(baseSale);

    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });
});

describe("거래 상대 선택 모달", () => {
  const openModal = (mode: "reserve" | "complete") =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TradeCounterpartyModal
          sale={baseSale}
          mode={mode}
          open
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    mockReserve.mockClear();
    mockComplete.mockClear();
    mockUpdateStatus.mockClear();
  });

  it("예약 모드에서 상대를 고르면 예약 API를 부른다", async () => {
    // 예약중은 다른 구매희망자에게 보내는 신호라 상대가 정해져야 한다.
    openModal("reserve");

    expect(screen.getByText("market.reserve_trade.title")).toBeInTheDocument();

    fireEvent.click(await screen.findByText("구매희망자"));
    fireEvent.click(screen.getByText("market.reserve_trade.confirm"));

    expect(mockReserve).toHaveBeenCalledWith(
      expect.objectContaining({ saleId: baseSale.id, buyerId: 42 }),
    );
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it("예약 모드에서 건너뛰면 상태만 예약중으로 바꾼다", async () => {
    openModal("reserve");

    fireEvent.click(await screen.findByText("market.reserve_trade.skip"));

    expect(mockReserve).not.toHaveBeenCalled();
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      { saleId: baseSale.id, status: SaleStatus.RESERVED },
      expect.anything(),
    );
  });

  it("완료 모드에서 상대를 고르면 완료 API를 부른다", async () => {
    openModal("complete");

    expect(screen.getByText("market.complete_trade.title")).toBeInTheDocument();

    fireEvent.click(await screen.findByText("구매희망자"));
    fireEvent.click(screen.getByText("market.complete_trade.confirm"));

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({ saleId: baseSale.id, buyerId: 42 }),
    );
  });

  it("완료 모드에서 건너뛰면 withoutCounterparty: true 로 완료 API를 부른다", async () => {
    openModal("complete");

    expect(screen.getByText("market.complete_trade.title")).toBeInTheDocument();

    fireEvent.click(await screen.findByText("market.complete_trade.skip"));

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: baseSale.id,
        buyerId: undefined,
        withoutCounterparty: true,
      }),
    );
  });
});
