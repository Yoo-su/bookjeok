import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  revalidateBookSale,
  revalidateReview,
  revalidateUserProfile,
} from "../revalidate";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const profileResponse = (handle: string) =>
  new Response(
    JSON.stringify({
      success: true,
      data: { id: 1, provider: "kakao", handle },
    }),
    { status: 200 },
  );

describe("재검증 서버 액션의 요청자 확인", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.mocked(revalidatePath).mockClear();
    vi.unstubAllGlobals();
  });

  it("토큰 없는 판매글·리뷰 재검증은 무시한다", async () => {
    await revalidateBookSale({ saleId: 1, deleted: true });
    await revalidateReview({ reviewId: 1, deleted: true });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("무효 토큰이면 무시한다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await revalidateBookSale({ saleId: 1, deleted: true, accessToken: "bad" });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("로그인한 회원이면 기존 범위 그대로 재검증한다", async () => {
    fetchMock.mockResolvedValue(profileResponse("reader"));

    await revalidateBookSale({ saleId: 7, deleted: true, accessToken: "ok" });

    const paths = vi.mocked(revalidatePath).mock.calls.map(([path]) => path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/ko/book/sales/7",
        "/en/book/sales/7",
        "/ko/book/market",
        "/ko",
      ]),
    );
  });

  it("프로필은 본인 토큰이면 재검증한다", async () => {
    fetchMock.mockResolvedValueOnce(profileResponse("reader"));

    await revalidateUserProfile({ handle: "reader", accessToken: "ok" });

    expect(revalidatePath).toHaveBeenCalledWith("/ko/users/reader");
  });

  it("남의 프로필은 404(탈퇴)가 아니면 재검증하지 않는다", async () => {
    fetchMock
      .mockResolvedValueOnce(profileResponse("reader"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await revalidateUserProfile({ handle: "someone", accessToken: "ok" });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("탈퇴 직후(토큰 무효)라도 프로필이 404면 재검증한다", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 404 }));

    await revalidateUserProfile({ handle: "gone", accessToken: "stale" });

    expect(revalidatePath).toHaveBeenCalledWith("/ko/users/gone");
  });
});
