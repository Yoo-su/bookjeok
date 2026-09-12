import { describe, expect, it } from "vitest";

import { isValidIsbn } from "../constants";

describe("isValidIsbn", () => {
  it("ISBN-13을 통과시킨다", () => {
    expect(isValidIsbn("9788937473135")).toBe(true);
  });

  it("ISBN-10과 체크문자 X를 통과시킨다", () => {
    expect(isValidIsbn("8937473135")).toBe(true);
    expect(isValidIsbn("097522980X")).toBe(true);
    expect(isValidIsbn("097522980x")).toBe(true);
  });

  it("자릿수가 안 맞으면 거른다", () => {
    expect(isValidIsbn("")).toBe(false);
    expect(isValidIsbn("123")).toBe(false);
    expect(isValidIsbn("97889374731")).toBe(false);
    expect(isValidIsbn("97889374731350")).toBe(false);
  });

  it("숫자가 아닌 문자열을 거른다", () => {
    expect(isValidIsbn("abcdefg")).toBe(false);
    expect(isValidIsbn("978893747313X")).toBe(false);
    expect(isValidIsbn("../../etc/passwd")).toBe(false);
  });

  it("공백·개행이 섞이면 거른다", () => {
    expect(isValidIsbn(" 9788937473135")).toBe(false);
    expect(isValidIsbn("9788937473135\n")).toBe(false);
  });
});
