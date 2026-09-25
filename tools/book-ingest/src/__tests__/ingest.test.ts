import { describe, expect, it, vi } from "vitest";

import type { PreparedCover } from "../cover";
import type { BookDimensions } from "../dimensions";
import { ingestBook, type IngestDeps } from "../ingest";
import type { Journal } from "../journal";
import { runApply } from "../workflow";
import { candidate } from "./fixtures";

const CDN = "https://cdn.bookjeok.com";

function deps(overrides: Partial<IngestDeps> = {}) {
  const calls: string[] = [];
  const prepared: PreparedCover = {
    body: Buffer.from("webp"),
    ext: "webp",
    contentType: "image/webp",
    original: { format: "jpeg", width: 458, height: 660, bytes: 50_000 },
    psnr: 38.2,
    converted: true,
  };
  const base: IngestDeps = {
    enrich: vi.fn(async (book) => (calls.push("enrich"), book)),
    downloadCover: vi.fn(
      async () => (calls.push("download"), Buffer.from("jpeg")),
    ),
    prepareCover: vi.fn(async () => (calls.push("prepare"), prepared)),
    saveOriginal: vi.fn(async () => void calls.push("saveOriginal")),
    store: {
      existingKey: vi.fn(async () => (calls.push("existingKey"), null)),
      put: vi.fn(async () => void calls.push("put")),
    },
    verifyPublic: vi.fn(async () => (calls.push("verify"), true)),
    coverColor: vi.fn(async () => (calls.push("color"), "#2a4b7c")),
    insertBook: vi.fn(
      async () => (calls.push("insert"), { book: true, dimension: true }),
    ),
    preflight: vi.fn(async () => void calls.push("preflight")),
    cdnBase: CDN,
  };
  return { deps: { ...base, ...overrides }, calls };
}

describe("ingestBook", () => {
  it("표지를 올리고 공개 URL을 확인한 뒤에만 INSERT한다", async () => {
    const { deps: d, calls } = deps();

    const { outcome } = await ingestBook(candidate(), d);

    expect(calls).toEqual([
      "enrich",
      "existingKey",
      "download",
      "prepare",
      "saveOriginal",
      "put",
      "verify",
      "color",
      "insert",
    ]);
    expect(outcome).toMatchObject({
      status: "inserted",
      image: `${CDN}/covers/9788937477515.webp`,
      cover: {
        key: "covers/9788937477515.webp",
        reused: false,
        converted: true,
      },
    });
    expect(d.store.put).toHaveBeenCalledWith(
      "covers/9788937477515.webp",
      Buffer.from("webp"),
      "image/webp",
    );
    expect(d.saveOriginal).toHaveBeenCalledWith(
      "9788937477515",
      Buffer.from("jpeg"),
      "jpg",
    );
    expect(d.insertBook).toHaveBeenCalledWith(
      expect.objectContaining({
        isbn: "9788937477515",
        image: `${CDN}/covers/9788937477515.webp`,
        salesPoint: null,
      }),
      expect.anything(),
    );
  });

  it("보강 조회로 받은 소개·판매지수로 INSERT하고 보강된 책을 돌려준다", async () => {
    const enriched = candidate({ description: "긴 소개", salesPoint: 3670 });
    const { deps: d } = deps({ enrich: vi.fn(async () => enriched) });

    const { outcome, book } = await ingestBook(candidate(), d);

    expect(outcome.status).toBe("inserted");
    expect(book).toBe(enriched);
    expect(d.insertBook).toHaveBeenCalledWith(
      expect.objectContaining({ description: "긴 소개", salesPoint: 3670 }),
      expect.anything(),
    );
  });

  it("보강 조회가 실패하면 R2에 쓰지 않고 실패로 남긴다", async () => {
    const { deps: d } = deps({
      enrich: vi.fn(async () => {
        throw new Error("공급처 오류: 쿼터 초과");
      }),
    });

    const { outcome } = await ingestBook(candidate(), d);

    expect(d.store.existingKey).not.toHaveBeenCalled();
    expect(d.store.put).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "failed",
      error: "공급처 오류: 쿼터 초과",
    });
  });

  it("첫 표지 후보가 실패하면 다음 후보를 받는다", async () => {
    const download = vi.fn(async (url: string) => {
      if (url.includes("/large/"))
        throw new Error("표지 다운로드 실패 (HTTP 404)");
      return Buffer.from("jpeg");
    });
    const { deps: d } = deps({ downloadCover: download });

    const { outcome } = await ingestBook(
      candidate({
        coverUrls: [
          "https://img.example/large/x.jpg",
          "https://img.example/small/x.jpg",
        ],
      }),
      d,
    );

    expect(download).toHaveBeenCalledTimes(2);
    expect(outcome).toMatchObject({
      status: "inserted",
      cover: {
        sourceUrl: "https://img.example/small/x.jpg",
      },
    });
  });

  it("R2에 이미 표지가 있으면 덮어쓰지 않고 그 키를 쓴다", async () => {
    const { deps: d } = deps({
      store: {
        existingKey: vi.fn(async () => "covers/9788937477515.jpg"),
        put: vi.fn(),
      },
    });

    const { outcome } = await ingestBook(candidate(), d);

    // 공급처 표지는 받지 않는다(표지색용으로 공개 URL만 받음)
    expect(d.downloadCover).toHaveBeenCalledTimes(1);
    expect(d.downloadCover).toHaveBeenCalledWith(
      `${CDN}/covers/9788937477515.jpg`,
    );
    expect(d.prepareCover).not.toHaveBeenCalled();
    expect(d.store.put).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "inserted",
      image: `${CDN}/covers/9788937477515.jpg`,
      cover: { reused: true },
    });
  });

  it("공개 URL이 200이 아니면 INSERT하지 않는다", async () => {
    const { deps: d } = deps({ verifyPublic: vi.fn(async () => false) });

    const { outcome } = await ingestBook(candidate(), d);

    expect(d.insertBook).not.toHaveBeenCalled();
    expect(outcome.status).toBe("failed");
  });

  it("표지 처리가 실패하면 업로드도 INSERT도 하지 않는다", async () => {
    const { deps: d } = deps({
      downloadCover: vi.fn(async () => {
        throw new Error("표지 다운로드 실패 (HTTP 404)");
      }),
    });

    const { outcome } = await ingestBook(candidate(), d);

    expect(d.store.put).not.toHaveBeenCalled();
    expect(d.insertBook).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "failed",
      error: "표지 다운로드 실패 (HTTP 404)",
    });
  });

  it("그사이 누가 넣었으면 already_exists", async () => {
    const { deps: d } = deps({
      insertBook: vi.fn(async () => ({ book: false, dimension: false })),
    });
    expect((await ingestBook(candidate(), d)).outcome.status).toBe(
      "already_exists",
    );
  });
});

describe("ingestBook — book_dimensions", () => {
  const measured: BookDimensions = {
    source: "aladin",
    width: 152,
    height: 223,
    depth: 17,
    pages: 297,
    weight: 440,
    binding: "반양장본",
  };

  it("보강 조회가 준 판형과 원본 표지에서 뽑은 색을 한 행으로 넣는다", async () => {
    const { deps: d } = deps({
      enrich: vi.fn(async (book) => ({ ...book, dimensions: measured })),
    });

    const { outcome } = await ingestBook(candidate(), d);

    // 가공 전 원본으로 색을 뽑는다 — 운영 적재분과 같은 입력
    expect(d.coverColor).toHaveBeenCalledWith(Buffer.from("jpeg"));
    expect(d.insertBook).toHaveBeenCalledWith(expect.anything(), {
      isbn: "9788937477515",
      width: 152,
      height: 223,
      depth: 17,
      pages: 297,
      weight: 440,
      binding: "반양장본",
      coverColor: "#2a4b7c",
    });
    expect(outcome).toMatchObject({
      status: "inserted",
      dimension: { written: true, dimensions: measured, coverColor: "#2a4b7c" },
    });
  });

  it("판형이 없으면(카카오) 표지색만 넣는다 — 크기는 서버가 추정", async () => {
    const { deps: d } = deps();

    await ingestBook(candidate(), d);

    expect(d.insertBook).toHaveBeenCalledWith(expect.anything(), {
      isbn: "9788937477515",
      width: null,
      height: null,
      depth: null,
      pages: null,
      weight: null,
      binding: null,
      coverColor: "#2a4b7c",
    });
  });

  it("재사용한 표지는 공개 URL에서 받아 색을 뽑는다", async () => {
    const download = vi.fn(async () => Buffer.from("public"));
    const { deps: d } = deps({
      downloadCover: download,
      store: {
        existingKey: vi.fn(async () => "covers/9788937477515.webp"),
        put: vi.fn(),
      },
    });

    await ingestBook(candidate(), d);

    expect(download).toHaveBeenCalledWith(`${CDN}/covers/9788937477515.webp`);
    expect(d.coverColor).toHaveBeenCalledWith(Buffer.from("public"));
  });

  it("표지색을 못 뽑아도 책은 넣고 사유를 남긴다", async () => {
    const { deps: d } = deps({
      enrich: vi.fn(async (book) => ({ ...book, dimensions: measured })),
      coverColor: vi.fn(async () => {
        throw new Error("unsupported image format");
      }),
    });

    const { outcome } = await ingestBook(candidate(), d);

    expect(outcome).toMatchObject({
      status: "inserted",
      dimension: {
        coverColor: null,
        colorError: "unsupported image format",
      },
    });
    expect(d.insertBook).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 152, coverColor: null }),
    );
  });

  it("판형도 표지색도 없으면 행을 만들지 않는다", async () => {
    const { deps: d } = deps({
      coverColor: vi.fn(async () => {
        throw new Error("x");
      }),
    });

    await ingestBook(candidate(), d);

    expect(d.insertBook).toHaveBeenCalledWith(expect.anything(), null);
  });

  it("판형 행 INSERT가 실패하면 책도 실패로 남긴다 — 한 트랜잭션", async () => {
    const { deps: d } = deps({
      insertBook: vi.fn(async () => {
        throw new Error("permission denied for table book_dimensions");
      }),
    });

    const { outcome } = await ingestBook(candidate(), d);

    expect(outcome).toMatchObject({
      status: "failed",
      error: "permission denied for table book_dimensions",
    });
  });
});

describe("runApply", () => {
  const journal = (): Journal & { records: Record<string, unknown>[] } => {
    const records: Record<string, unknown>[] = [];
    return { path: "run.jsonl", records, write: (r) => void records.push(r) };
  };

  it("쓰기 권한이 없으면 보강 조회·표지 업로드 전에 멈춘다", async () => {
    const { deps: d } = deps({
      preflight: vi.fn(async () => {
        throw new Error("book_dimensions(RLS 정책)이 없어 적재할 수 없습니다");
      }),
    });

    await expect(runApply([candidate()], d, journal())).rejects.toThrow(
      "RLS 정책",
    );
    expect(d.enrich).not.toHaveBeenCalled();
    expect(d.store.put).not.toHaveBeenCalled();
  });

  it("판형 행과 실측 수를 따로 센다", async () => {
    const { deps: d } = deps({
      enrich: vi.fn(async (book) =>
        book.isbn === "9788937477515"
          ? {
              ...book,
              dimensions: {
                source: "aladin",
                width: 152,
                height: 223,
                depth: 17,
                pages: null,
                weight: null,
                binding: null,
              },
            }
          : book,
      ),
    });
    const j = journal();

    const summary = await runApply(
      [candidate(), candidate({ isbn: "9788937465024", isbn10: null })],
      d,
      j,
    );

    expect(summary).toMatchObject({
      inserted: 2,
      dimensionRows: 2,
      measured: 1,
      colorFailed: 0,
    });
    // 기록에 판형과 표지색이 남는다
    expect(j.records[0]).toMatchObject({
      type: "ingest",
      dimension: { dimensions: { width: 152 }, coverColor: "#2a4b7c" },
    });
  });
});
