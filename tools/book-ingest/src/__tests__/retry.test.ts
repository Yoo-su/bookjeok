import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openJournal } from "../journal";
import { readRetryCandidates } from "../retry";
import { candidate } from "./fixtures";

describe("중단 후 재시도", () => {
  it("동일 시각의 두 실행도 서로 다른 기록 파일을 쓴다", () => {
    const now = new Date("2026-11-01T00:00:00.000Z");
    expect(openJournal("apply", now).path).not.toBe(
      openJournal("apply", now).path,
    );
  });
  it("성공한 책은 제외하고 실패·미처리 책을 복원한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bookjeok-retry-"));
    const path = join(dir, "apply.jsonl");
    try {
      const books = [
        candidate(),
        candidate({ isbn: "9788937449673" }),
        candidate({ isbn: "9788936481667" }),
      ];
      await writeFile(
        path,
        [
          { type: "apply_plan", version: 1, books },
          { type: "ingest", isbn: books[0].isbn, status: "inserted" },
          { type: "ingest", isbn: books[1].isbn, status: "failed" },
        ]
          .map((r) => JSON.stringify(r))
          .join("\n") + '\n{"type":"ing',
      );
      expect(
        (await readRetryCandidates(path)).map((book) => book.isbn),
      ).toEqual(["9788937449673", "9788936481667"]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
