import { describe, expect, it } from "vitest";

import { REVIEW_TAG_MAX_LENGTH } from "../constants";
import { normalizeTagName, normalizeTagNames } from "../utils";

describe("normalizeTagName", () => {
  it("앞뒤 공백과 선행 #을 걷어낸다", () => {
    expect(normalizeTagName("  #카뮈 ")).toBe("카뮈");
    expect(normalizeTagName("##카뮈")).toBe("카뮈");
  });

  it("내부 공백은 지우지 않고 하나로 압축한다", () => {
    // 지워버리면 `의식의흐름`이 되어 표시가 망가진다
    expect(normalizeTagName("의식의   흐름")).toBe("의식의 흐름");
    expect(normalizeTagName("가즈오　이시구로")).toBe("가즈오 이시구로");
  });

  it("대소문자는 보존한다", () => {
    // 소문자로 내리면 표시가 `sf`가 된다. 흔들림은 자동완성이 막는다.
    expect(normalizeTagName("SF")).toBe("SF");
  });

  it("자모 분리 입력을 NFC로 합친다", () => {
    expect(normalizeTagName("가")).toBe("가");
  });

  it("최대 길이에서 자른다", () => {
    const long = "가".repeat(REVIEW_TAG_MAX_LENGTH + 10);
    expect(normalizeTagName(long)).toHaveLength(REVIEW_TAG_MAX_LENGTH);
  });

  it("공백뿐인 입력은 빈 문자열이 된다", () => {
    expect(normalizeTagName("   ")).toBe("");
    expect(normalizeTagName("#")).toBe("");
  });
});

describe("normalizeTagNames", () => {
  it("정규화 후 중복과 빈 값을 걷어내고 입력 순서를 지킨다", () => {
    expect(normalizeTagNames(["#카뮈", " 카뮈", "", "  ", "부조리"])).toEqual([
      "카뮈",
      "부조리",
    ]);
  });

  it("대소문자가 다르면 서로 다른 태그로 남긴다", () => {
    expect(normalizeTagNames(["SF", "sf"])).toEqual(["SF", "sf"]);
  });
});
