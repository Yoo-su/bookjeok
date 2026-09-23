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
    publisherStats: vi.fn(async () => [{ publisher: "민음사", count: 839 }]),
    scan: vi.fn<IngestServices["scan"]>(async (publishers) =>
      publishers.map((publisher) => ({
        publisher,
        pages: 1,
        totalCount: 1,
        fresh: [candidate()],
        known: [],
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
        body: JSON.stringify({ publishers: ["민음사"] }),
      }),
    );
    const { scanId } = events.find((e) => e.type === "result");

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
      body: JSON.stringify({ publishers: [] }),
    });
    expect(res.status).toBe(400);
    expect(services.scan).not.toHaveBeenCalled();
  });
});
