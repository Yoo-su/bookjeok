import { describe, expect, it } from "vitest";

import { generateUniqueFilename } from "@/shared/utils/generate-unique-filename";

describe("generateUniqueFilename (고유 파일명 생성)", () => {
  it("타임스탬프-UUID 형식의 파일명을 생성한다", () => {
    const result = generateUniqueFilename("test.jpg");
    // 타임스탬프-UUID.확장자 형식인지 확인
    expect(result).toMatch(/^\d+-[\w-]+\.jpg$/);
  });

  it("원본 파일의 확장자를 유지한다", () => {
    expect(generateUniqueFilename("photo.png")).toMatch(/\.png$/);
    expect(generateUniqueFilename("document.pdf")).toMatch(/\.pdf$/);
  });

  it("확장자를 소문자로 변환한다", () => {
    expect(generateUniqueFilename("Photo.JPG")).toMatch(/\.jpg$/);
    expect(generateUniqueFilename("Image.PNG")).toMatch(/\.png$/);
  });

  it("확장자가 없는 파일도 처리한다", () => {
    const result = generateUniqueFilename("noextension");
    // UUID 형식만 있고 확장자 점이 없어야 함
    expect(result).toMatch(/^\d+-[\w-]+$/);
  });

  it("overrideExtension이 주어지면 확장자를 덮어쓴다", () => {
    const result = generateUniqueFilename("photo.png", ".webp");
    expect(result).toMatch(/\.webp$/);
  });

  it("매번 고유한 파일명을 생성한다", () => {
    const result1 = generateUniqueFilename("test.jpg");
    const result2 = generateUniqueFilename("test.jpg");
    expect(result1).not.toBe(result2);
  });
});
