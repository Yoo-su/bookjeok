import { ReadingLog, readingLogKeys } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

import { applyUpdatedLog, insertLog, removeLog, yearListKey } from "../cache";

const log = (id: string, date: string, memo = ""): ReadingLog =>
  ({ id, date, memo }) as ReadingLog;
const ids = (logs: ReadingLog[]) => logs.map((l) => l.id);

describe("독서 기록 연 목록 캐시", () => {
  it("기록 날짜의 해 키를 만든다", () => {
    expect(yearListKey("2025-12-31")).toEqual(
      readingLogKeys.list({ year: 2025 }).queryKey,
    );
  });

  it("날짜순 자리에 넣고, 같은 날이면 기존 기록 뒤에 붙인다", () => {
    const logs = [log("a", "2026-01-03"), log("b", "2026-03-01")];
    expect(ids(insertLog(logs, log("n", "2026-02-10")))).toEqual([
      "a",
      "n",
      "b",
    ]);
    expect(ids(insertLog(logs, log("n", "2026-01-03")))).toEqual([
      "a",
      "n",
      "b",
    ]);
    expect(ids(insertLog(logs, log("n", "2026-12-31")))).toEqual([
      "a",
      "b",
      "n",
    ]);
  });

  it("이미 있는 기록은 다시 넣지 않는다", () => {
    const logs = [log("a", "2026-01-03")];
    expect(insertLog(logs, log("a", "2026-01-03"))).toBe(logs);
  });

  it("날짜가 같은 수정은 제자리에서 바꿔 같은 날 순서를 지킨다", () => {
    const logs = [log("a", "2026-05-01"), log("b", "2026-05-01")];
    const next = applyUpdatedLog(logs, log("a", "2026-05-01", "새 메모"));
    expect(ids(next)).toEqual(["a", "b"]);
    expect(next[0].memo).toBe("새 메모");
  });

  it("날짜가 바뀐 수정은 빼고, 새 자리는 insertLog가 맡는다", () => {
    const logs = [
      log("a", "2026-05-01"),
      log("b", "2026-05-01"),
      log("c", "2026-07-01"),
    ];
    const moved = log("a", "2026-06-15");
    expect(ids(insertLog(applyUpdatedLog(logs, moved), moved))).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("목록에 없는 기록이면 같은 배열을 돌려줘 다시 그리지 않게 한다", () => {
    const logs = [log("a", "2026-05-01")];
    expect(applyUpdatedLog(logs, log("z", "2026-05-01"))).toBe(logs);
    expect(removeLog(logs, "z")).toBe(logs);
  });

  it("지우면 그 기록만 빠진다", () => {
    const logs = [log("a", "2026-05-01"), log("b", "2026-05-01")];
    expect(ids(removeLog(logs, "a"))).toEqual(["b"]);
  });
});
