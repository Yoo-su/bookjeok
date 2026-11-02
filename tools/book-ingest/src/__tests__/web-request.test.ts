import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { createHtmlCache } from "../web/cache";
import { createHtmlRequest } from "../web/request";

describe("웹 요청과 캐시", () => {
  it.each([
    new TypeError("terminated"),
    new DOMException("timed out", "TimeoutError"),
  ])(
    "HTTP 200 뒤 본문 수신 오류도 전체 중단 오류로 반환한다: %s",
    async (error) => {
      const fetcher = vi.fn<typeof fetch>(async () => {
        const response = new Response("<p>partial</p>");
        vi.spyOn(response, "text").mockRejectedValue(error);
        return response;
      });
      const request = createHtmlRequest({ fetcher, intervalMs: 0 });
      await expect(
        request("https://www.aladin.co.kr/book"),
      ).rejects.toMatchObject({
        fatal: true,
        message: expect.stringContaining("네트워크 연결 실패·시간 초과"),
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it.each([403, 429])(
    "HTTP %s는 재요청하지 않고 전체 중단 오류로 반환한다",
    async (status) => {
      const fetcher = vi.fn<typeof fetch>(
        async () => new Response("blocked", { status }),
      );
      const request = createHtmlRequest({ fetcher, intervalMs: 0 });
      await expect(
        request(
          "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=9788937449673",
        ),
      ).rejects.toMatchObject({ fatal: true });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("동시 요청도 호스트별로 직렬화하고 간격을 지킨다", async () => {
    let clock = 0;
    const times: number[] = [];
    const fetcher = vi.fn<typeof fetch>(async () => {
      times.push(clock);
      return new Response("<p>ok</p>");
    });
    const request = createHtmlRequest({
      fetcher,
      now: () => clock,
      wait: async (ms) => {
        clock += ms;
      },
      intervalMs: 3000,
    });
    await Promise.all([
      request("https://www.yes24.com/a"),
      request("https://www.yes24.com/b"),
      request("https://www.yes24.com/c"),
    ]);
    expect(times).toEqual([0, 3000, 6000]);
  });
  it("캐시는 프로세스 사이에 유지되고 24시간 뒤 만료된다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bookjeok-web-cache-"));
    let clock = 100;
    try {
      await createHtmlCache(dir, () => clock).write(
        "book:9788937449673",
        "<p>ok</p>",
      );
      const cache = createHtmlCache(dir, () => clock);
      expect(await cache.read("book:9788937449673")).toBe("<p>ok</p>");
      clock += 24 * 60 * 60 * 1000 + 1;
      expect(await cache.read("book:9788937449673")).toBeNull();
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
