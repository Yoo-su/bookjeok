import { MetadataRoute } from "next";

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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-square-sketch.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
