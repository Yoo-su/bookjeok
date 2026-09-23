import { describe, expect, it, vi } from "vitest";

import type { PreparedCover } from "../cover";
import { ingestBook, type IngestDeps } from "../ingest";
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
    insertBook: vi.fn(async () => (calls.push("insert"), true)),
    cdnBase: CDN,
  };
  return { deps: { ...base, ...overrides }, calls };
}

describe("ingestBook", () => {
  it("표지를 올리고 공개 URL을 확인한 뒤에만 INSERT한다", async () => {
    const { deps: d, calls } = deps();

    const outcome = await ingestBook(candidate(), d);

    expect(calls).toEqual([
      "existingKey",
      "download",
      "prepare",
      "saveOriginal",
      "put",
      "verify",
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
      }),
    );
  });

  it("R2에 이미 표지가 있으면 덮어쓰지 않고 그 키를 쓴다", async () => {
    const { deps: d } = deps({
      store: {
        existingKey: vi.fn(async () => "covers/9788937477515.jpg"),
        put: vi.fn(),
      },
    });

    const outcome = await ingestBook(candidate(), d);

    expect(d.downloadCover).not.toHaveBeenCalled();
    expect(d.store.put).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "inserted",
      image: `${CDN}/covers/9788937477515.jpg`,
      cover: { reused: true },
    });
  });

  it("공개 URL이 200이 아니면 INSERT하지 않는다", async () => {
    const { deps: d } = deps({ verifyPublic: vi.fn(async () => false) });

    const outcome = await ingestBook(candidate(), d);

    expect(d.insertBook).not.toHaveBeenCalled();
    expect(outcome.status).toBe("failed");
  });

  it("표지 처리가 실패하면 업로드도 INSERT도 하지 않는다", async () => {
    const { deps: d } = deps({
      downloadCover: vi.fn(async () => {
        throw new Error("표지 다운로드 실패 (HTTP 404)");
      }),
    });

    const outcome = await ingestBook(candidate(), d);

    expect(d.store.put).not.toHaveBeenCalled();
    expect(d.insertBook).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "failed",
      error: "표지 다운로드 실패 (HTTP 404)",
    });
  });

  it("그사이 누가 넣었으면 already_exists", async () => {
    const { deps: d } = deps({ insertBook: vi.fn(async () => false) });
    expect((await ingestBook(candidate(), d)).status).toBe("already_exists");
  });
});
