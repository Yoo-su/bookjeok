import { MetadataRoute } from "next";

import { BRAND_ASSETS } from "@/shared/constants/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "북적 (Bookjeok)",
    short_name: "북적",
    description:
      "독서 기록, 도서 검색·AI 요약, 리뷰, 중고책 거래 통합 도서 플랫폼",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    categories: ["books", "education", "shopping"],
    icons: [
      {
        src: BRAND_ASSETS.icon192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: BRAND_ASSETS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ASSETS.maskableIcon,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
