import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createIngestServer, type IngestServices } from "../server";
import { candidate } from "./fixtures";

const TOKEN = "t0ken";
let close: (() => Promise<void>) | undefined;

afterEach(async () => {
  await close?.();
  close = undefined;
});

async function start(overrides: Partial<IngestServices> = {}) {
  const services: IngestServices = {
    target: "db.example:5432/postgres",
    sources: [
      {
        id: "kakao",
        label: "카카오",
        maxPages: 20,
        envKey: "KAKAO_REST_API_KEY",
        enrichNote: null,
        dimensionNote: "",
        available: true,
      },
      {
        id: "other",
        label: "다른 공급처",
        maxPages: 4,
        envKey: "OTHER_API_KEY",
        enrichNote: null,
        dimensionNote: "",
        available: false,
      },
    ],
    publisherStats: vi.fn(async () => [{ publisher: "민음사", count: 839 }]),
    scan: vi.fn<IngestServices["scan"]>(async (source, targets) =>
      targets.map((target) => ({
        source,
        target,
        label: target.kind === "publisher" ? target.publisher : "검색",
        pages: 1,
        totalCount: 2,
        fresh: [candidate()],
        known: [
          candidate({ isbn: "9788932027265", title: "사람, 장소, 환대" }),
        ],
        excluded: [],
      })),
    ),
    apply: vi.fn<IngestServices["apply"]>(async (books, onBook) => {
      books.forEach((book, i) =>
        onBook(
          {
            isbn: book.isbn,
            status: "inserted",
            image: "https://cdn.bookjeok.com/covers/x.webp",
            cover: { key: "covers/x.webp", reused: false },
            dimension: {
              written: true,
              dimensions: null,
              coverColor: "#2a4b7c",
            },
          },
          i,
          book,
        ),
      );
      return {
        total: books.length,
        inserted: books.length,
        alreadyExists: 0,
        failed: 0,
        reusedCovers: 0,
        emptyAuthor: 0,
        dimensionRows: books.length,
        measured: 0,
        colorFailed: 0,
        journal: "run.jsonl",
      };
    }),
    getFavorites: () => [],
    setFavorites: vi.fn(),
    ...overrides,
  };
  // 포트를 알아야 Host 검사를 맞출 수 있어, 빈 포트를 먼저 얻고 그 포트로 띄운다
  const probe = createIngestServer({
    port: 0,
    token: TOKEN,
    services,
    html: "<p>__INGEST_TOKEN__</p>",
  });
  await new Promise<void>((r) => probe.listen(0, "127.0.0.1", r));
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((r) => probe.close(() => r()));

  const server = createIngestServer({
    port,
    token: TOKEN,
    services,
    imageOrigins: ["https://search1.kakaocdn.net", "https://img.example"],
    html: "<p>__INGEST_TOKEN__</p>",
  });
  await new Promise<void>((r) => server.listen(port, "127.0.0.1", r));
  close = () => new Promise((r) => server.close(() => r()));
  const base = `http://127.0.0.1:${port}`;
  const call = (path: string, init: RequestInit = {}) =>
    fetch(base + path, {
      ...init,
      headers: {
        "x-ingest-token": TOKEN,
        "content-type": "application/json",
        ...init.headers,
      },
    });
  return { base, call, services };
}

const readEvents = async (res: Response) =>
  (await res.text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

describe("createIngestServer", () => {
  it("화면에 이번 실행의 토큰을 심는다", async () => {
    const { base } = await start();
    expect(await (await fetch(base + "/")).text()).toBe(`<p>${TOKEN}</p>`);
  });

  it("공급처 정의에서 모은 출처만 표지 미리보기로 허용한다", async () => {
    const { base } = await start();
    const csp = (await fetch(base + "/")).headers.get(
      "content-security-policy",
    );
    expect(csp).toContain(
      "img-src https://search1.kakaocdn.net https://img.example;",
    );
  });

  it("토큰이 없거나 틀리면 API를 거절한다", async () => {
    const { base, call } = await start();
    expect((await fetch(base + "/api/publishers")).status).toBe(403);
    expect(
      (await call("/api/publishers", { headers: { "x-ingest-token": "nope" } }))
        .status,
    ).toBe(403);
    expect((await call("/api/publishers")).status).toBe(200);
  });

  it("Host가 127.0.0.1/localhost가 아니면 거절한다 — DNS 리바인딩 방지", async () => {
    const { base } = await start();
    const { request } = await import("node:http");
    const url = new URL(base);
    const status = await new Promise<number>((resolve, reject) => {
      const req = request(
        {
          host: url.hostname,
          port: url.port,
          path: "/",
          headers: { host: "evil.example" },
        },
        (res) => resolve(res.statusCode ?? 0),
      );
      req.on("error", reject);
      req.end();
    });
    expect(status).toBe(403);
  });

  it("조회한 후보만 적재한다 — 화면이 보낸 책 데이터를 믿지 않는다", async () => {
    const { call, services } = await start();
    const events = await readEvents(
      await call("/api/scan", {
        method: "POST",
        body: JSON.stringify({ source: "kakao", publishers: ["민음사"] }),
      }),
    );
    const result = events.find((e) => e.type === "result");
    const { scanId } = result;
    // 화면에는 공급처 원본과 표지 원본 주소를 보내지 않는다
    expect(result.sections[0].fresh[0]).not.toHaveProperty("raw");
    expect(result.sections[0].fresh[0]).not.toHaveProperty("coverUrls");
    // 이미 있는 책은 목록 표시에 필요한 것만
    expect(result.sections[0].known).toEqual([
      {
        isbn: "9788932027265",
        title: "사람, 장소, 환대",
        author: "이서수",
        pubDate: "2026-09-18",
      },
    ]);

    // 보유 책은 조회 결과에 있어도 적재 대상이 아니다
    const known = await call("/api/apply", {
      method: "POST",
      body: JSON.stringify({ scanId, isbns: ["9788932027265"] }),
    });
    expect(known.status).toBe(400);

    const unknown = await call("/api/apply", {
      method: "POST",
      body: JSON.stringify({ scanId, isbns: ["9780000000002"] }),
    });
    expect(unknown.status).toBe(400);
    expect(services.apply).not.toHaveBeenCalled();

    const applied = await readEvents(
      await call("/api/apply", {
        method: "POST",
        body: JSON.stringify({ scanId, isbns: ["9788937477515"] }),
      }),
    );
    expect(applied.map((e) => e.type)).toEqual(["book", "done"]);
    expect(services.apply).toHaveBeenCalledWith(
      [candidate()],
      expect.any(Function),
    );
  });

  it("없는 scanId는 404", async () => {
    const { call } = await start();
    const res = await call("/api/apply", {
      method: "POST",
      body: JSON.stringify({ scanId: "nope", isbns: ["9788937477515"] }),
    });
    expect(res.status).toBe(404);
  });

  it("출판사를 고르지 않으면 조회하지 않는다", async () => {
    const { call, services } = await start();
    const res = await call("/api/scan", {
      method: "POST",
      body: JSON.stringify({ source: "kakao", publishers: [] }),
    });
    expect(res.status).toBe(400);
    expect(services.scan).not.toHaveBeenCalled();
  });

  it("키가 없거나 모르는 공급처로는 조회하지 않는다", async () => {
    const { call, services } = await start();
    for (const source of ["other", "naver", undefined]) {
      const res = await call("/api/scan", {
        method: "POST",
        body: JSON.stringify({ source, publishers: ["민음사"] }),
      });
      expect(res.status).toBe(400);
    }
    expect(services.scan).not.toHaveBeenCalled();
  });

  it("페이지 수를 공급처 상한으로 자른다", async () => {
    const { call, services } = await start();
    await (
      await call("/api/scan", {
        method: "POST",
        body: JSON.stringify({
          source: "kakao",
          publishers: ["민음사"],
          maxPages: 99,
        }),
      })
    ).text();
    expect(services.scan).toHaveBeenCalledWith(
      "kakao",
      [{ kind: "publisher", publisher: "민음사" }],
      20,
      expect.any(Function),
    );
  });

  it("자유 검색어를 받아 ISBN을 알아보고 조회한다", async () => {
    const { call, services } = await start();
    await (
      await call("/api/scan", {
        method: "POST",
        body: JSON.stringify({
          source: "kakao",
          query: { text: "978-89-320-2726-5", field: "title", sort: "latest" },
          maxPages: 1,
        }),
      })
    ).text();
    expect(services.scan).toHaveBeenCalledWith(
      "kakao",
      [
        {
          kind: "keyword",
          query: { text: "9788932027265", field: "isbn", sort: "latest" },
        },
      ],
      1,
      expect.any(Function),
    );
  });

  it.each([
    [{ text: "  " }],
    [{ text: 42 }],
    [{ text: "사탄탱고", field: "publisher" }],
    [{ text: "사탄탱고", sort: "sales" }],
  ])("잘못된 검색어 %j는 조회하지 않는다", async (query) => {
    const { call, services } = await start();
    const res = await call("/api/scan", {
      method: "POST",
      body: JSON.stringify({ source: "kakao", query }),
    });
    expect(res.status).toBe(400);
    expect(services.scan).not.toHaveBeenCalled();
  });
});
