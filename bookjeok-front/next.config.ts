import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true, // Vercel 무료 플랜 Image Optimization 제한 회피
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        port: "",
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
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
