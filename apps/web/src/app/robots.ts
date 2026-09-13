import { MetadataRoute } from "next";

import { ZERO_VALUE_CRAWLERS } from "@/shared/config/crawlers";

export default function robots(): MetadataRoute.Robots {
  // Preview 환경(test.bookjeok.com 등)에서만 크롤러 차단
  if (process.env.VERCEL_ENV === "preview") {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
    };
  }

  return {
    rules: [
      // 목록의 강제는 미들웨어가 한다. 여기는 지키는 쪽에게 미리 알리는 용도다.
      {
        userAgent: [...ZERO_VALUE_CRAWLERS],
        disallow: ["/"],
      },
      // 일반 크롤러 허용 (Googlebot, Naver 등 포함)
      //
      // /en은 막지 않는다. 수집을 끊으면 크롤러가 레이아웃의 noindex를 읽지 못해
      // 이미 색인된 /en 페이지가 그대로 남는다. 색인이 빠진 뒤 Disallow로 전환할 것.
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/*/my-page", "/*/login", "/*/signup", "/*/callback"],
      },
    ],
    sitemap: "https://bookjeok.com/sitemap.xml",
  };
}
