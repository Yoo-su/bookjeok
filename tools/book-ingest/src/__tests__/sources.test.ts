import { describe, expect, it } from "vitest";

import { createSources, describeSources } from "../sources";

describe("종료된 API 제거", () => {
  it("알라딘 키가 남아 있어도 카카오 후보 검색만 등록한다", () => {
    expect([
      ...createSources({
        KAKAO_REST_API_KEY: "k",
        ALADIN_TTB_KEY: "old",
      }).keys(),
    ]).toEqual(["kakao"]);
    expect(describeSources({ KAKAO_REST_API_KEY: "k" })[0]).toMatchObject({
      lists: null,
      available: true,
      dimensionNote: expect.stringContaining("두께는 YES24"),
    });
  });
});
