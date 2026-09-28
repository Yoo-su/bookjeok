import { describe, expect, it } from "vitest";

import { isOwnedBlobUrl } from "../blob-owner";

const owner = { id: 12, provider: "kakao" };
const host = "https://abc123.public.blob.vercel-storage.com";

describe("isOwnedBlobUrl", () => {
  it("본인 디렉터리의 파일만 허용한다", () => {
    expect(isOwnedBlobUrl(`${host}/kakao-12/sales-images/a.jpg`, owner)).toBe(
      true,
    );
    expect(isOwnedBlobUrl(`${host}/kakao-1/sales-images/a.jpg`, owner)).toBe(
      false,
    );
    // 접두사만 같은 다른 사용자 (kakao-120)
    expect(isOwnedBlobUrl(`${host}/kakao-120/sales-images/a.jpg`, owner)).toBe(
      false,
    );
  });

  it("다른 호스트·상위 경로 탈출·잘못된 URL을 거부한다", () => {
    expect(
      isOwnedBlobUrl("https://evil.example.com/kakao-12/a.jpg", owner),
    ).toBe(false);
    expect(isOwnedBlobUrl(`${host}/kakao-12/%2e%2e/kakao-1/a.jpg`, owner)).toBe(
      false,
    );
    expect(isOwnedBlobUrl("not a url", owner)).toBe(false);
    expect(
      isOwnedBlobUrl(
        "http://abc123.public.blob.vercel-storage.com/kakao-12/a.jpg",
        owner,
      ),
    ).toBe(false);
  });
});
