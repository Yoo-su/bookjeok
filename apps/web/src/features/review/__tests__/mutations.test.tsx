import * as apis from "@bookjeok/api-client";
import { Review, reviewKeys, ReviewReactionType } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleReviewReactionMutation } from "@/features/review/mutations";

vi.mock("@bookjeok/api-client", () => ({
  toggleReviewReaction: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/shared/config/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// ISR 재검증 서버 액션은 테스트 환경에서 실행할 수 없으므로 모킹
vi.mock("@/shared/actions/revalidate", () => ({
  revalidateBookSale: vi.fn().mockResolvedValue(undefined),
  revalidateReview: vi.fn().mockResolvedValue(undefined),
}));

const mockReviewId = 100;
const mockReview = {
  id: mockReviewId,
  isbn: "1234",
  title: "리뷰 제목",
  content: "리뷰 내용",
  rating: 5,
  isPublic: true,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  user: { id: 1, handle: "userA", nickname: "UserA", profileImageUrl: null },
  reactionCounts: {
    [ReviewReactionType.LIKE]: 10,
    [ReviewReactionType.INSIGHTFUL]: 5,
    [ReviewReactionType.SUPPORT]: 2,
  },
  commentCount: 0,
  tags: [],
  imageUrls: [],
  viewCount: 0,
} as unknown as Review;

describe("useToggleReviewReactionMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // 초기 캐시 데이터 셋업 (리뷰 상세 정보 + 나의 이전 리액션)
    queryClient.setQueryData(
      reviewKeys.detail(mockReviewId).queryKey,
      mockReview,
    );
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      null, // 초기엔 리액션을 한 적 없음
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("새로운 리액션을 추가하면 해당 카운트가 1 증가하고 나의 리액션 캐시가 업데이트된다", async () => {
    let resolveApi!: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(apis.toggleReviewReaction).mockReturnValue(apiPromise as any);

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    result.current.mutate(ReviewReactionType.LIKE);

    await waitFor(() => {
      const reviewCache = queryClient.getQueryData<Review>(
        reviewKeys.detail(mockReviewId).queryKey,
      );
      // 기존 10에서 11로 증가해야 함
      expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(11);

      const reactionCache = queryClient.getQueryData<ReviewReactionType | null>(
        [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      );
      expect(reactionCache).toBe(ReviewReactionType.LIKE);
    });

    await act(async () => {
      resolveApi({});
      await apiPromise;
    });
  });

  it("이미 선택한 리액션을 다시 클릭하면 선택 해제(카운트 1 감소)되어야 한다", async () => {
    // 셋업: 기존에 이미 LIKE를 클릭한 상태라고 가정
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      ReviewReactionType.LIKE,
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.LIKE);
    });

    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // 10에서 1 감소하여 9가 되어야 함 (mock 초기값이 10이므로 본래 9였던 것이라고 가정되는 로직에 따라 즉시 차감됨)
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(9);

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    expect(reactionCache).toBeNull(); // 상태 초기화 확인
  });

  it("다른 리액션으로 변경 시 이전 것은 감소하고 새로운 것은 증가해야 한다", async () => {
    // 셋업: 기존에 LIKE를 클릭한 상태
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      ReviewReactionType.LIKE,
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      // LIKE -> INSIGHTFUL 로 변경 시도
      result.current.mutate(ReviewReactionType.INSIGHTFUL);
    });

    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // LIKE는 10 -> 9
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(9);
    // INSIGHTFUL은 5 -> 6
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.INSIGHTFUL]).toBe(
      6,
    );

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    expect(reactionCache).toBe(ReviewReactionType.INSIGHTFUL);
  });

  it("API 호출 실패 시, 리뷰 리액션 카운트와 내 리액션 캐시가 모두 롤백되어야 한다", async () => {
    vi.mocked(apis.toggleReviewReaction).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.SUPPORT);
    });

    // 롤백 확인
    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // 2 (+1 실패 후 롤백) -> 2 유지
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.SUPPORT]).toBe(2);

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    // 실패했으므로 내 리액션은 여전히 null이어야 함
    expect(reactionCache).toBeNull();
  });
  it("API 호출이 실패하면 사용자에게 오류 토스트를 띄운다", async () => {
    vi.mocked(apis.toggleReviewReaction).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.LIKE);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("reaction_error");
    });
  });

  it("성공하면 낙관적 카운트를 서버가 돌려준 카운트로 교정한다", async () => {
    // 캐시는 LIKE 10인데 그사이 다른 사용자가 반응해 서버 실제 값은 12였던 상황
    const serverCounts = {
      [ReviewReactionType.LIKE]: 13,
      [ReviewReactionType.INSIGHTFUL]: 5,
      [ReviewReactionType.SUPPORT]: 2,
    };
    vi.mocked(apis.toggleReviewReaction).mockResolvedValueOnce({
      ...mockReview,
      reactionCounts: serverCounts,
    });

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.LIKE);
    });

    await waitFor(() => {
      const reviewCache = queryClient.getQueryData<Review>(
        reviewKeys.detail(mockReviewId).queryKey,
      );
      expect(reviewCache?.reactionCounts).toEqual(serverCounts);
    });
    expect(
      queryClient.getQueryData([
        ...reviewKeys.detail(mockReviewId).queryKey,
        "reaction",
      ]),
    ).toBe(ReviewReactionType.LIKE);
  });

  it("서버 응답으로 교정할 때 카운트 외 필드는 덮지 않는다 (비공개 리뷰 본문 보호)", async () => {
    // 비공개 리뷰의 작성자는 인증 조회로 받은 원문을 캐시에 들고 있다
    queryClient.setQueryData(reviewKeys.detail(mockReviewId).queryKey, {
      ...mockReview,
      isPublic: false,
    });
    // 토글 응답은 인증 없이 조회한 결과라 본문이 비어 있다
    vi.mocked(apis.toggleReviewReaction).mockResolvedValueOnce({
      ...mockReview,
      isPublic: false,
      content: "",
    });

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.LIKE);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    expect(reviewCache?.content).toBe("리뷰 내용");
  });
});
