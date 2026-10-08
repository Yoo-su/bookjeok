import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));

const TOKEN = "test-revalidate-token";

const post = async (
  body: unknown,
  headers: Record<string, string> = { "x-revalidate-token": TOKEN },
) => {
  const { POST } = await import("../route");
  return POST(
    new NextRequest("https://bookjeok.test/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
};

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidatePath.mockClear();
    process.env.REVALIDATE_TOKEN = TOKEN;
  });

  afterEach(() => {
    delete process.env.REVALIDATE_TOKEN;
  });

  it("토큰이 설정되지 않으면 503으로 실패한다 (폴백 없음)", async () => {
    delete process.env.REVALIDATE_TOKEN;

    const res = await post({ path: "/ko" });

    expect(res.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("토큰이 틀리면 401", async () => {
    const res = await post({ path: "/ko" }, { "x-revalidate-token": "wrong" });

    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("토큰 헤더가 없으면 401", async () => {
    const res = await post({ path: "/ko" }, {});

    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("허용 목록 밖의 경로는 400", async () => {
    for (const path of ["/ko/my-page", "/admin", "../etc", "/fr"]) {
      revalidatePath.mockClear();
      const res = await post({ path });

      expect(res.status).toBe(400);
      expect(revalidatePath).not.toHaveBeenCalled();
    }
  });

  it("ISR 라우트는 재검증한다", async () => {
    for (const path of [
      "/ko",
      "/en/book/market",
      "/ko/book/sales/123",
      "/ko/book/reviews/45",
      "/ko/book/9788934942467/detail",
      "/ko/users/reader42",
      "/en/insights",
    ]) {
      revalidatePath.mockClear();
      const res = await post({ path });

      expect(res.status).toBe(200);
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });

  it("GET 핸들러를 노출하지 않는다 (img 태그 등으로 발동 불가)", async () => {
    const route = await import("../route");

    expect("GET" in route).toBe(false);
  });

  it("서버 리뷰 변경은 모든 로케일의 상세만 비운다", async () => {
    const res = await post({ reviewId: 45, removed: false });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, reviewId: 45 });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath.mock.calls).toEqual(
      expect.arrayContaining([
        ["/ko/book/reviews/45"],
        ["/en/book/reviews/45"],
      ]),
    );
  });

  it("삭제·비공개 전환은 목록과 홈에 남은 공개 글도 걷어낸다", async () => {
    const res = await post({ reviewId: 45, removed: true });
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(6);
    expect(revalidatePath.mock.calls).toEqual(
      expect.arrayContaining([
        ["/ko/book/reviews/45"],
        ["/ko/book/reviews"],
        ["/ko"],
        ["/en/book/reviews/45"],
        ["/en/book/reviews"],
        ["/en"],
      ]),
    );
  });

  it("리뷰 변경 웹훅도 인증을 요구한다", async () => {
    const res = await post({ reviewId: 45, removed: true }, {});
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("잘못된 리뷰 id·removed·혼합 요청을 거절한다", async () => {
    for (const body of [
      { reviewId: 0, removed: false },
      { reviewId: 1.5, removed: false },
      { reviewId: "45", removed: false },
      { reviewId: Number.MAX_SAFE_INTEGER + 1, removed: false },
      { reviewId: 45 },
      { reviewId: 45, removed: "true" },
      { reviewId: 45, removed: false, path: "/ko" },
    ]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
