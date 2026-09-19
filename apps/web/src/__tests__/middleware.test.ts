import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// next-intl의 ESM 번들은 vitest에서 next/server를 해석하지 못한다.
// 검사 대상은 이 저장소의 게이트이므로 통과 지점만 흉내 낸다.
vi.mock("next-intl/middleware", () => ({
  default: () => async () => {
    const { NextResponse } = await import("next/server");
    return NextResponse.next();
  },
}));

import middleware from "../middleware";

const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const APPLEBOT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)";
const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

const call = async (
  path: string,
  headers: Record<string, string> = { "user-agent": CHROME },
) =>
  await middleware(new NextRequest(`https://bookjeok.com${path}`, { headers }));

const statusOf = async (path: string, headers?: Record<string, string>) =>
  (await call(path, headers)).status;

describe("middleware 크롤러 게이트", () => {
  it("검색 유입 없는 크롤러는 403으로 끊는다", async () => {
    expect(await statusOf("/ko", { "user-agent": APPLEBOT })).toBe(403);
    expect(await statusOf("/ko", { "user-agent": "GPTBot/1.0" })).toBe(403);
  });

  it("Googlebot은 통과시킨다", async () => {
    expect(await statusOf("/ko", { "user-agent": GOOGLEBOT })).toBe(200);
  });

  it("중국 트래픽은 403", async () => {
    const status = await statusOf("/ko", {
      "user-agent": CHROME,
      "x-vercel-ip-country": "CN",
    });
    expect(status).toBe(403);
  });
});

describe("middleware 경로 게이트", () => {
  it("앞자리 0은 쿼리를 보존해 정규 URL로 영구 이동한다", async () => {
    const response = await call("/ko/book/reviews/0078?from=share");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://bookjeok.com/ko/book/reviews/78?from=share",
    );
    expect((await call("/book/sales/00020")).headers.get("location")).toBe(
      "https://bookjeok.com/ko/book/sales/20",
    );
  });

  it.each(["0", "78e0", "0x4e", "-1", "9007199254740992", "abc"])(
    "비정규 ID %s는 렌더 전에 404",
    async (id) => {
      expect(await statusOf(`/ko/book/reviews/${id}`)).toBe(404);
      expect(await statusOf(`/ko/book/sales/${id}`)).toBe(404);
    },
  );

  it("글 작성 경로는 숫자 검사에서 제외한다", async () => {
    expect(await statusOf("/ko/book/reviews/write")).toBe(200);
    expect(await statusOf("/ko/book/sales/register")).toBe(200);
  });
  // `[locale]`이 `.env`를 로케일 파라미터로 받아 249KB를 렌더하고 ISR 엔트리로 남기던 자리
  it("로케일 없는 파일형 경로는 렌더 없이 404", async () => {
    expect(await statusOf("/.env")).toBe(404);
    expect(await statusOf("/index.php")).toBe(404);
    expect(await statusOf("/config.json")).toBe(404);
  });

  // `[...not_found]`는 동적이라 매 요청 133KB 셸을 다시 그린다
  it("로케일 아래 알 수 없는 세그먼트는 렌더 없이 404", async () => {
    expect(await statusOf("/ko/wp-admin")).toBe(404);
    expect(await statusOf("/ko/xmlrpc.php")).toBe(404);
    expect(await statusOf("/en/some-random-path")).toBe(404);
  });

  it("형식이 틀린 ISBN은 렌더 없이 404", async () => {
    expect(await statusOf("/ko/book/abc/detail")).toBe(404);
    expect(await statusOf("/ko/book/12345/detail")).toBe(404);
  });

  it("실제 라우트는 통과시킨다", async () => {
    const paths = [
      "/ko",
      "/en",
      "/ko/lounge",
      "/ko/insights",
      "/ko/book/market",
      "/ko/book/reviews",
      "/ko/book/reviews/77",
      "/ko/book/sales/12",
      "/ko/book/9788934942474/detail",
      "/ko/users/someone",
      "/ko/terms",
      "/ko/privacy",
      "/ko/login",
      "/ko/share/deck/someone",
    ];

    for (const path of paths) {
      expect({ path, status: await statusOf(path) }).toEqual({
        path,
        status: 200,
      });
    }
  });

  it("로케일 없는 일반 경로는 301로 기본 로케일에 붙인다", async () => {
    const res = await call("/lounge");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toContain("/ko/lounge");
  });

  it("루트는 기본 로케일로 301", async () => {
    expect((await call("/")).status).toBe(301);
  });

  // 301을 태우면 리다이렉트 + 404 렌더로 두 번 청구된다
  it("로케일 없는 알 수 없는 경로는 301 없이 바로 404", async () => {
    expect(await statusOf("/admin")).toBe(404);
    expect(await statusOf("/wp-admin")).toBe(404);
  });

  it("sitemap·robots는 리다이렉트하지 않는다", async () => {
    expect(await statusOf("/robots.txt")).toBe(200);
    expect(await statusOf("/sitemap.xml")).toBe(200);
  });
});
