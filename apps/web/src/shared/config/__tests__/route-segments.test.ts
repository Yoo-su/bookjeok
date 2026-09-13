import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { isKnownLocaleSegment, LOCALE_ROOT_SEGMENTS } from "../route-segments";

const LOCALE_DIR = path.resolve(__dirname, "../../../app/[locale]");

/** 라우트 그룹 `(auth)`는 URL에 안 나타나므로 그 안쪽을 펼친다. */
function collectRouteSegments(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        return collectRouteSegments(path.join(dir, entry.name));
      }
      // 동적·캐치올 세그먼트는 첫 세그먼트 허용 목록의 대상이 아니다.
      if (entry.name.startsWith("[")) return [];
      return [entry.name];
    });
}

describe("LOCALE_ROOT_SEGMENTS", () => {
  // PATHS에 등록하지 않고 라우트만 추가하면 미들웨어가 그 경로를 404로 끊는다.
  // 그 사고를 배포 전에 잡는 것이 이 테스트의 존재 이유다.
  it("app/[locale] 아래 실제 라우트를 모두 포함한다", () => {
    const actual = collectRouteSegments(LOCALE_DIR);
    const missing = actual.filter(
      (segment) => !LOCALE_ROOT_SEGMENTS.has(segment),
    );

    expect(missing).toEqual([]);
  });

  it("로케일 루트는 세그먼트 없이 통과한다", () => {
    expect(isKnownLocaleSegment(undefined)).toBe(true);
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

  it("알 수 없는 세그먼트는 막는다", () => {
    expect(isKnownLocaleSegment("wp-admin")).toBe(false);
    expect(isKnownLocaleSegment("xmlrpc.php")).toBe(false);
  });

  it("알려진 세그먼트는 통과한다", () => {
    expect(isKnownLocaleSegment("book")).toBe(true);
    expect(isKnownLocaleSegment("users")).toBe(true);
    expect(isKnownLocaleSegment("lounge")).toBe(true);
  });
});
