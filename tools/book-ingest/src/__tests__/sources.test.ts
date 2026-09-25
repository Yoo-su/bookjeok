import { describe, expect, it } from "vitest";

import { createSources, describeSources, dimensionLender } from "../sources";

const both = { KAKAO_REST_API_KEY: "k", ALADIN_TTB_KEY: "a" };

describe("dimensionLender", () => {
  it("카카오 책에는 알라딘이 판형을 빌려 준다", () => {
    expect(dimensionLender(createSources(both), "kakao")?.id).toBe("aladin");
  });

  it("알라딘은 보강 조회에서 스스로 받으므로 빌리지 않는다", () => {
    expect(dimensionLender(createSources(both), "aladin")).toBeNull();
  });

  it("알라딘 키가 없으면(10/30 이후) 빌려 줄 곳이 없다", () => {
    expect(
      dimensionLender(createSources({ KAKAO_REST_API_KEY: "k" }), "kakao"),
    ).toBeNull();
  });
});

describe("describeSources", () => {
  it("공급처마다 book_dimensions에 무엇이 들어가는지 알린다", () => {
    const notes = Object.fromEntries(
      describeSources(both).map((s) => [s.id, s.dimensionNote]),
    );
    expect(notes.kakao).toContain("알라딘에서 ISBN으로");
    expect(notes.aladin).toContain("판형·쪽수와 표지색");
    expect(
      describeSources({ KAKAO_REST_API_KEY: "k" }).find((s) => s.id === "kakao")
        ?.dimensionNote,
    ).toContain("표지색만");
  });
});
