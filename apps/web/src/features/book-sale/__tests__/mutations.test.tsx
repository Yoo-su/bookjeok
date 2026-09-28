import * as apis from "@bookjeok/api-client";
import { bookSaleKeys, SaleStatus, UsedBookSale } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateBookSaleStatusMutation } from "@/features/book-sale/mutations";

// API 호출 함수들을 모킹
vi.mock("@bookjeok/api-client", () => ({
  updateBookSaleStatus: vi.fn(),
}));

// 알림(Toast) 및 라우터 모킹 (에러 및 이동 방지용)
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// ISR 재검증 서버 액션은 테스트 환경에서 실행할 수 없으므로 모킹
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateBookSale: vi.fn().mockResolvedValue(undefined),
  revalidateReview: vi.fn().mockResolvedValue(undefined),
}));
// AuthStore 모킹 (다른 훅들에서 접근할 수 있으므로)
vi.mock("@/features/auth/stores/use-auth-store", () => {
  const state = { user: { id: 1, provider: "KAKAO" }, accessToken: "token" };
  return {
    useAuthStore: Object.assign(
      vi.fn((selector) => selector(state)),
      { getState: () => state },
    ),
  };
});

const mockSales: UsedBookSale[] = [
  {
    id: 1,
    bookTitle: "테스트 책 1",
    price: 10000,
    status: SaleStatus.FOR_SALE, // SaleStatus Enum 사용
    sellerId: 1,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    isbn: "123",
  } as unknown as UsedBookSale,
  {
    id: 2,
    bookTitle: "테스트 책 2",
    price: 15000,
    status: SaleStatus.FOR_SALE,
    sellerId: 1,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    isbn: "456",
  } as unknown as UsedBookSale,
];

describe("useUpdateBookSaleStatusMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // 초기 캐시 데이터 셋업
    queryClient.setQueryData(bookSaleKeys.mySales.queryKey, mockSales);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("mutate 호출 시, API 완료 전 UI 상태(캐시)가 먼저 낙관적으로 변경되어야 한다", async () => {
    // API 응답을 지연시키는 프로미스 제어
    let resolveApi!: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });

    vi.mocked(apis.updateBookSaleStatus).mockReturnValue(apiPromise as any);

    const { result } = renderHook(() => useUpdateBookSaleStatusMutation(), {
      wrapper,
    });

    result.current.mutate({ saleId: 1, status: SaleStatus.SOLD }); // SOLD 사용

    // onMutate가 실행될 때까지 기다림
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<UsedBookSale[]>(
        bookSaleKeys.mySales.queryKey,
      );
      expect(cachedData?.find((item) => item.id === 1)?.status).toBe(
        SaleStatus.SOLD,
      );
    });

    // 나머지 항목은 영향 받지 않아야 함
    const currentCache = queryClient.getQueryData<UsedBookSale[]>(
      bookSaleKeys.mySales.queryKey,
    );
    expect(currentCache?.find((item) => item.id === 2)?.status).toBe(
      SaleStatus.FOR_SALE,
    );

    // Promise를 resolve하여 정상 종료시킴
    await act(async () => {
      resolveApi({});
      await apiPromise; // 비동기 완료 대기
    });
  });

  it("API 호출 실패 시, 변경되었던 UI 캐시 상태가 이전 상태(롤백)로 복구되어야 한다", async () => {
    vi.mocked(apis.updateBookSaleStatus).mockRejectedValueOnce(
      new Error("Server Error"),
    );

    const { result } = renderHook(() => useUpdateBookSaleStatusMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ saleId: 1, status: SaleStatus.SOLD }); // SOLD 교체
    });

    // onError 과정에서 롤백이 진행되었는지 확인
    const cachedData = queryClient.getQueryData<UsedBookSale[]>(
      bookSaleKeys.mySales.queryKey,
    );

    expect(cachedData?.find((item) => item.id === 1)?.status).toBe(
      SaleStatus.FOR_SALE, // FOR_SALE 교체
    );
  });
});
