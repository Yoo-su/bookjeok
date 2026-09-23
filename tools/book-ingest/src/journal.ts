import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { DATA_DIR } from "./config";

export interface Journal {
  path: string;
  write(record: Record<string, unknown>): void;
}

/**
 * 실행 기록을 JSONL로 남깁니다. 카카오 원본 문서(`authors[]`·`translators[]` 포함)를
 * 그대로 담으므로, 정규화 규칙이 바뀌면 카카오를 다시 부르지 않고 이 파일에서
 * 다시 만들 수 있습니다.
 */
export function openJournal(kind: "scan" | "apply", now = new Date()): Journal {
  const dir = resolve(DATA_DIR, "runs");
  mkdirSync(dir, { recursive: true });
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  const path = resolve(dir, `${stamp}-${kind}.jsonl`);
  return {
    path,
    write(record) {
      appendFileSync(
        path,
        `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`,
      );
    },
  };
}
