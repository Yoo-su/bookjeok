import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  "./src/shared/config/i18n/request.ts",
);

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output:
    process.env.OUTPUT_STANDALONE === "true" ||
    process.env.DOCKER === "true" ||
    process.platform !== "win32"
      ? "standalone"
      : undefined,
  images: {
    remotePatterns: [
      /**
       * 표지 자체 호스팅(Cloudflare R2). `books.image`가 이 호스트로 넘어가기 전에
       * 먼저 배포되어 있어야 한다. 순서가 뒤바뀌면 next/image가 표지를 전부 막는다.
       */
      {
        protocol: "https",
        hostname: "cdn.bookjeok.com",
        pathname: "/covers/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.kopis.or.kr",
      },
      {
        protocol: "https",
        hostname: "img1.kakaocdn.net",
      },
      {
        protocol: "http",
        hostname: "img1.kakaocdn.net",
      },
      {
        protocol: "http",
        hostname: "k.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "shopping-phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "image.aladin.co.kr",
      },
      {
        protocol: "http",
        hostname: "image.aladin.co.kr",
      },
    ],
  },
  transpilePackages: [
    "@bookjeok/react-query",
    "@bookjeok/core",
    "@bookjeok/api-client",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  /**
   * Next는 /_next/static에만 장기 캐시를 붙이고 public/은 max-age=0으로 내보낸다.
   * 히어로 영상/포스터는 매 방문 재검증이 낭비라 30일 캐시를 명시한다.
   * 파일명이 고정이라 immutable은 쓰지 않는다. (교체 시 갱신이 막힌다)
   */
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          {
            // connection()으로 빌드 API 호출을 피하면서 XML 응답도 캐시한다.
            // 브라우저용 Cache-Control과 분리해 Vercel CDN에만 적용한다.
            key: "Vercel-CDN-Cache-Control",
            value:
              process.env.VERCEL_ENV === "preview"
                ? "no-store"
                : "public, s-maxage=21600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
};

export default withAnalyzer(withNextIntl(nextConfig));
