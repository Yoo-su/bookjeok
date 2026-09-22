import { describe, expect, it } from "vitest";

import { createPageMetadata, generateGlobalMetadata } from "../metadata";

describe("createPageMetadata (페이지별 메타데이터 생성 헬퍼)", () => {
  it.each([
    ["", "home"],
    ["/book/market", "market"],
    ["/book/reviews", "reviews"],
    ["/lounge", "lounge"],
  ])("%s는 전용 가로 공유 카드를 사용한다", (path, image) => {
    const metadata = createPageMetadata({
      title: "제목",
      description: "설명",
      path,
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: `/og/ko-${image}.png`, alt: "제목", width: 1200, height: 630 },
    ]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it.each(["ko", "en"])("%s 홈과 전역 OG·Twitter 카드가 일치한다", (locale) => {
    const home = createPageMetadata({
      title: "북적",
      description: "설명",
      locale,
      path: "",
    });
    const global = generateGlobalMetadata((key) => key, locale);
    const url = `/og/${locale}-home.png`;
    expect(home.openGraph?.images).toEqual([
      { url, alt: "북적", width: 1200, height: 630 },
    ]);
    expect(home.twitter?.images).toEqual(home.openGraph?.images);
    expect(global.openGraph?.images).toEqual([
      { url, alt: "meta.default_title", width: 1200, height: 630 },
    ]);
    expect(global.twitter?.images).toEqual([url]);
  });

  it("세로 도서 표지는 작은 카드로 전달한다", () => {
    const metadata = createPageMetadata({
      title: "책",
      description: "설명",
      imageUrl: "https://cdn.bookjeok.com/covers/123.webp",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary" });
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.bookjeok.com/covers/123.webp", alt: "책" },
    ]);
  });
  it("기본 metadataBase와 오픈 그래프 속성들이 올바르게 반환되어야 한다", () => {
    const meta = createPageMetadata({
      title: "테스트 제목",
      description: "테스트 설명",
      locale: "ko",
      path: "/test-path",
    });

    expect(meta.metadataBase?.toString()).toBe("https://bookjeok.com/");
    expect(meta.title).toBe("테스트 제목");
    expect(meta.description).toBe("테스트 설명");

    // Open Graph 검증
    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph?.title).toBe("테스트 제목 | 북적");
    expect(meta.openGraph?.description).toBe("테스트 설명");
    expect(meta.openGraph?.images).toEqual([
      {
        url: "/logo-og-sketch.png",
        alt: "테스트 제목",
        width: 1200,
        height: 630,
      },
    ]);
    expect(meta.openGraph?.siteName).toBe("Bookjeok");
    expect(meta.openGraph?.url).toBe("https://bookjeok.com/ko/test-path");

    // Alternates 검증
    expect(meta.alternates).toBeDefined();
    expect(meta.alternates?.canonical).toBe("/ko/test-path");
    // /en은 레이아웃에서 noindex 처리하므로 hreflang alternate에서 제외
    expect(meta.alternates?.languages).toEqual({
      ko: "/ko/test-path",
      "x-default": "/ko/test-path",
    });
  });

  it("커스텀 이미지를 제공하면 오픈 그래프 이미지로 지정되어야 한다", () => {
    const meta = createPageMetadata({
      title: "테스트 제목",
      description: "테스트 설명",
      imageUrl: "https://example.com/custom.png",
      locale: "en",
      path: "test-path",
    });

    expect(meta.openGraph?.images).toEqual([
      { url: "https://example.com/custom.png", alt: "테스트 제목" },
    ]);
    expect(meta.openGraph?.title).toBe("테스트 제목 | Bookjeok");
    expect(meta.openGraph?.url).toBe("https://bookjeok.com/en/test-path");
  });

  it("이미 브랜드명이 포함된 타이틀이나 홈 경로는 absolute 타이틀로 처리되어 중복이 방지되어야 한다", () => {
    const metaHome = createPageMetadata({
      title: "북적 - AI 도서 추천, 독서 기록, 리뷰, 중고책 거래",
      description: "홈 설명",
      path: "",
    });

    expect(metaHome.title).toEqual({
      absolute: "북적 - AI 도서 추천, 독서 기록, 리뷰, 중고책 거래",
    });
    expect(metaHome.openGraph?.title).toBe(
      "북적 - AI 도서 추천, 독서 기록, 리뷰, 중고책 거래",
    );
  });

  // 자기 참조가 없는 클러스터는 무효이고, noindex URL은 대체 언어판이 될 수 없다.
  it("ko 외 로케일에는 hreflang 클러스터를 붙이지 않는다", () => {
    const meta = createPageMetadata({
      title: "테스트 제목",
      description: "테스트 설명",
      locale: "en",
      path: "/test-path",
    });

    expect(meta.alternates?.canonical).toBe("/en/test-path");
    expect(meta.alternates?.languages).toBeUndefined();
  });

  it("noIndex 옵션이 true일 경우 robots 설정에 index: false가 적용되어야 한다", () => {
    const meta = createPageMetadata({
      title: "비공개 페이지",
      description: "비공개 설명",
      noIndex: true,
    });

    expect(meta.robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("generateGlobalMetadata (전역 메타데이터)", () => {
  it("ko는 색인을 허용한다", () => {
    expect(generateGlobalMetadata((key) => key, "ko").robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  // nofollow를 걸면 크롤러가 /en 안을 돌지 못해 하위 페이지의 noindex를 읽지 못한다.
  it("ko 외 로케일은 noindex이되 링크는 따라가게 둔다", () => {
    expect(generateGlobalMetadata((key) => key, "en").robots).toEqual({
      index: false,
      follow: true,
    });
  });
});
