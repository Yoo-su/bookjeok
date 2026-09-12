import "@/shared/libs/axios";

import { getBookSales, getReviews } from "@bookjeok/api-client";
import { MetadataRoute } from "next";

// 봇이 칠 때마다 함수를 깨우고 백엔드를 두 번 치던 자리.
// 내용은 목록 상위 50건이라 6시간 단위로 굳혀도 색인에 영향이 없다.
export const revalidate = 21600; // 6시간

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Preview 환경(test.bookjeok.com 등)에서는 sitemap 비활성화
  if (process.env.VERCEL_ENV === "preview") {
    return [];
  }

  const baseUrl = "https://bookjeok.com";
  const defaultLocale = "ko";

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. 정적 라우트
  const staticPaths = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/book/market", changeFrequency: "hourly" as const, priority: 0.9 },
    { path: "/book/reviews", changeFrequency: "daily" as const, priority: 0.8 },
    {
      path: "/book/search",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    { path: "/insights", changeFrequency: "weekly" as const, priority: 0.3 },
    { path: "/lounge", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  staticPaths.forEach(({ path, changeFrequency, priority }) => {
    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}${path}`,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko${path}`,
          "x-default": `${baseUrl}/ko${path}`,
        },
      },
    });
  });

  const bookIsbns = new Set<string>();

  // 2. 동적 라우트: 리뷰
  try {
    const { reviews } = await getReviews({ page: 1, limit: 50 });
    // 비공개 리뷰는 상세 페이지가 noindex이므로 사이트맵에서 제외
    const publicReviews = reviews?.filter(
      (review) => review.isPublic !== false,
    );
    publicReviews?.forEach((review) => {
      if (review.book?.isbn) {
        bookIsbns.add(review.book.isbn);
      }
      sitemapEntries.push({
        url: `${baseUrl}/${defaultLocale}/book/reviews/${review.id}`,
        ...(review.updatedAt && { lastModified: new Date(review.updatedAt) }),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/book/reviews/${review.id}`,
            "x-default": `${baseUrl}/ko/book/reviews/${review.id}`,
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to fetch reviews for sitemap:", error);
  }

  // 3. 동적 라우트: 판매글
  try {
    const { sales } = await getBookSales({ page: 1, limit: 50 });
    sales?.forEach((sale) => {
      if (sale.book?.isbn) {
        bookIsbns.add(sale.book.isbn);
      }
      sitemapEntries.push({
        url: `${baseUrl}/${defaultLocale}/book/sales/${sale.id}`,
        ...(sale.updatedAt && { lastModified: new Date(sale.updatedAt) }),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/book/sales/${sale.id}`,
            "x-default": `${baseUrl}/ko/book/sales/${sale.id}`,
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to fetch sales for sitemap:", error);
  }

  // 4. 동적 라우트: 도서 상세 정보
  bookIsbns.forEach((isbn) => {
    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}/book/${isbn}/detail`,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko/book/${isbn}/detail`,
          "x-default": `${baseUrl}/ko/book/${isbn}/detail`,
        },
      },
    });
  });

  return sitemapEntries;
}
