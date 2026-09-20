import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { isKnownLocalePath } from "../route-segments";

const LOCALE_DIR = path.resolve(__dirname, "../../../app/[locale]");

/** 전체 page.tsx 경로를 순회하여 허용 목록 누락을 배포 전에 잡는다. */
function collectPagePaths(dir: string, segments: string[] = []): string[][] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isFile()) return entry.name === "page.tsx" ? [segments] : [];
    if (!entry.isDirectory() || entry.name.includes("...")) return [];
    const group = entry.name.startsWith("(");
    const segment = entry.name.startsWith("[") ? "123" : entry.name;
    return collectPagePaths(
      path.join(dir, entry.name),
      group ? segments : [...segments, segment],
    );
  });
}

describe("전체 라우트 허용 목록", () => {
  it("app/[locale]의 정적·동적·중첩 페이지를 모두 통과시킨다", () => {
    const missing = collectPagePaths(LOCALE_DIR).filter(
      (segments) => !isKnownLocalePath(segments),
    );
    expect(missing).toEqual([]);
  });

  it("로케일 루트는 세그먼트 없이 통과한다", () => {
    expect(isKnownLocalePath([])).toBe(true);
  });

  // 미들웨어 matcher가 제외하지 않는 확장자는 미들웨어의 파일형 경로 규칙에 걸려 404가 된다.
  // public/에 새 확장자를 추가하고 matcher를 안 고치면 그 자산이 죽는다.
  it("public/의 모든 확장자가 미들웨어 matcher 제외 목록에 있다", () => {
    const publicDir = path.resolve(__dirname, "../../../../public");
    const middlewareSrc = fs.readFileSync(
      path.resolve(__dirname, "../../../middleware.ts"),
      "utf8",
    );
    const excluded = new Set(
      (middlewareSrc.match(/\(\?:([a-z0-9|]+)\)\$/)?.[1] ?? "").split("|"),
    );

    const collect = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collect(full);
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        return ext ? [ext] : [];
      });

    const missing = [...new Set(collect(publicDir))].filter(
      (ext) => !excluded.has(ext),
    );

    expect(missing).toEqual([]);
  });

  it("유효 루트 아래 존재하지 않는 페이지도 막는다", () => {
    expect(isKnownLocalePath(["book", "unknown"])).toBe(false);
    expect(isKnownLocalePath(["book", "market", "extra"])).toBe(false);
    expect(isKnownLocalePath(["users", "someone", "extra"])).toBe(false);
  });
});
