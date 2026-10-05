import * as apis from "@bookjeok/api-client";
import { CompleteTradeResult, UsedBookSale } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCancelSaleReservationMutation,
  useCompleteDirectTradeMutation,
  useReserveSaleMutation,
} from "@/features/trade/mutations";
import { revalidateBookSale } from "@/shared/actions/revalidate";

vi.mock("@bookjeok/api-client", () => ({
  reserveSaleForBuyer: vi.fn(),
  cancelSaleReservation: vi.fn(),
  completeDirectTrade: vi.fn(),
}));
const refresh = vi.fn();
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateBookSale: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/features/auth/stores/use-auth-store", () => {
  const state = { accessToken: "token" };
  return { useAuthStore: { getState: () => state } };
});

const sale = { id: 7 } as UsedBookSale;

describe("거래 상대 지정·취소·완료의 판매글 상세 ISR 재검증", () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it("예약 성공 시 호출부 콜백 후 판매글 상세를 비우고 라우터를 새로 고친다", async () => {
    vi.mocked(apis.reserveSaleForBuyer).mockResolvedValue(sale);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useReserveSaleMutation({ onSuccess }), {
      wrapper,
    });

    act(() => result.current.mutate({ saleId: 7, buyerId: 2 }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith(sale);
    expect(revalidateBookSale).toHaveBeenCalledWith({
      saleId: 7,
      accessToken: "token",
    });
  });

  it("예약 취소 성공 시 판매글 상세를 비운다", async () => {
    vi.mocked(apis.cancelSaleReservation).mockResolvedValue(sale);
    const { result } = renderHook(() => useCancelSaleReservationMutation(), {
      wrapper,
    });

    act(() => result.current.mutate(7));

    await waitFor(() =>
      expect(revalidateBookSale).toHaveBeenCalledWith({
        saleId: 7,
        accessToken: "token",
      }),
    );
  });

  it("완료 성공 시 응답의 판매글 id로 상세를 비운다", async () => {
    const completed: CompleteTradeResult = { sale, completion: null };
    vi.mocked(apis.completeDirectTrade).mockResolvedValue(completed);
    const { result } = renderHook(() => useCompleteDirectTradeMutation(), {
      wrapper,
    });

    act(() => result.current.mutate({ saleId: 7 }));

    await waitFor(() =>
      expect(revalidateBookSale).toHaveBeenCalledWith({
        saleId: 7,
        accessToken: "token",
      }),
    );
  });

  it("실패하면 재검증하지 않고 호출부 onError만 부른다", async () => {
    vi.mocked(apis.reserveSaleForBuyer).mockRejectedValue(new Error("거절"));
    const onError = vi.fn();
    const { result } = renderHook(() => useReserveSaleMutation({ onError }), {
      wrapper,
    });

    act(() => result.current.mutate({ saleId: 7, buyerId: 2 }));

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(revalidateBookSale).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
