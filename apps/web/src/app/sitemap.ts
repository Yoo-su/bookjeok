import "@/shared/libs/axios";

import { getBookSales, getReviews } from "@bookjeok/api-client";
import { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

// 공개 글 전체를 커서로 순회하되, 요청마다 재조회하지 않도록 6시간 캐시한다.
// 조회 실패는 전파해 이전 정상 sitemap을 불완전한 목록으로 덮어쓰지 않는다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Preview 환경(test.bookjeok.com 등)에서는 sitemap 비활성화
  if (process.env.VERCEL_ENV === "preview") {
    return [];
  }

  // 빌드에는 API 서버가 없어도 된다. 첫 요청부터 완성된 목록을 캐시한다.
  await connection();
  return getCachedSitemap();
}

const getCachedSitemap = unstable_cache(buildSitemap, ["public-sitemap-v1"], {
  revalidate: 21600,
});

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
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
    {
      path: "/reading-height",
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
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
  let reviewCursor: number | undefined;
  const reviewCursors = new Set<number>();
  while (true) {
    const { reviews, hasNextPage, nextCursor } = await getReviews({
      page: 1,
      limit: 50,
      cursorId: reviewCursor,
    });
    // 비공개 리뷰는 상세 페이지가 noindex이므로 사이트맵에서 제외
    const publicReviews = reviews?.filter((review) => review.isPublic === true);
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
    if (!hasNextPage) break;
    if (!nextCursor || reviewCursors.has(nextCursor))
      throw new Error("Invalid review sitemap cursor");
    reviewCursors.add(nextCursor);
    reviewCursor = nextCursor;
    if (sitemapEntries.length >= 25000)
      throw new Error("Split sitemap before adding more URLs");
  }

  // 3. 동적 라우트: 판매글
  let saleCursor: string | undefined;
  const saleCursors = new Set<string>();
  while (true) {
    const { sales, hasNextPage, nextCursor } = await getBookSales({
      page: 1,
      limit: 50,
      cursor: saleCursor,
    });
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
    if (!hasNextPage) break;
    if (!nextCursor || saleCursors.has(nextCursor))
      throw new Error("Invalid sale sitemap cursor");
    saleCursors.add(nextCursor);
    saleCursor = nextCursor;
    if (sitemapEntries.length >= 25000)
      throw new Error("Split sitemap before adding more URLs");
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

  // 목록이 갱신되는 동안 중복된 항목이 있어도 URL은 한 번만 출력한다.
  const entries = [
    ...new Map(sitemapEntries.map((entry) => [entry.url, entry])).values(),
  ];
  if (entries.length > 50000)
    throw new Error("Sitemap exceeds 50,000 URLs; split it");
  return entries;
}
