import * as apis from "@bookjeok/api-client";
import { TradeMethod } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateBookSaleMutation,
  useUpdateBookSaleMutation,
} from "@/features/book-sale/mutations";
import { uploadSaleImages } from "@/features/book-sale/services/image-upload-service";

vi.mock("@bookjeok/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@bookjeok/api-client")>();
  return {
    ...actual,
    privateApiClient: { get: vi.fn().mockResolvedValue({ data: {} }) },
    createBookSale: vi.fn(),
    updateBookSale: vi.fn(),
  };
});
vi.mock("@/features/book-sale/services/image-upload-service", () => ({
  uploadSaleImages: vi.fn(),
}));
vi.mock("@/features/book-sale/actions/delete-action", () => ({
  deleteImages: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateBookSale: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/features/auth/stores/use-auth-store", () => {
  const state = { user: { id: 1, provider: "KAKAO" }, accessToken: "token" };
  return {
    useAuthStore: Object.assign(
      vi.fn((selector: (s: typeof state) => unknown) => selector(state)),
      { getState: () => state },
    ),
  };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      })
    }
  >
    {children}
  </QueryClientProvider>
);

const file = new File(["x"], "cover.jpg", { type: "image/jpeg" });
const createVariables = {
  imageFiles: [file],
  payload: {
    title: "판매",
    price: 1000,
    tradeMethod: TradeMethod.DIRECT_ONLY,
    content: "내용",
    city: "서울",
    district: "마포구",
    isbn: "9788937460777",
  },
};

describe("book sale pre-save failures", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(apis.createBookSale).mockReset();
    vi.mocked(apis.updateBookSale).mockReset();
    vi.mocked(uploadSaleImages).mockReset();
  });

  it("reports an upload failure on create without calling the API", async () => {
    vi.mocked(uploadSaleImages).mockRejectedValue(new Error("업로드 실패"));
    const { result } = renderHook(() => useCreateBookSaleMutation(), {
      wrapper,
    });

    await expect(result.current.mutateAsync(createVariables)).rejects.toThrow(
      "업로드 실패",
    );

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("업로드 실패");
    expect(apis.createBookSale).not.toHaveBeenCalled();
  });

  it("reports a save failure on create only once", async () => {
    vi.mocked(uploadSaleImages).mockResolvedValue(["https://blob/1.jpg"]);
    vi.mocked(apis.createBookSale).mockRejectedValue(new Error("저장 실패"));
    const { result } = renderHook(() => useCreateBookSaleMutation(), {
      wrapper,
    });

    await expect(result.current.mutateAsync(createVariables)).rejects.toThrow(
      "저장 실패",
    );

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("저장 실패");
  });

  it("reports an upload failure on update without calling the API", async () => {
    vi.mocked(uploadSaleImages).mockRejectedValue(new Error("업로드 실패"));
    const { result } = renderHook(() => useUpdateBookSaleMutation(), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({
        saleId: 3,
        payload: { imageUrls: [] },
        newImageFiles: [file],
      }),
    ).rejects.toThrow("업로드 실패");

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(apis.updateBookSale).not.toHaveBeenCalled();
  });
});
