import { MetadataRoute } from "next";

import { searchBookSales } from "@/features/book/apis";
import { getReviews } from "@/features/review/apis";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.bookjeok.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/book/market`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book/reviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/book/search`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 동적 라우트 (리뷰 및 판매글)
  let reviewRoutes: MetadataRoute.Sitemap = [];
  let saleRoutes: MetadataRoute.Sitemap = [];

  try {
    // 최신 리뷰 50개를 가져와서 사이트맵에 추가
    const { reviews } = await getReviews({ page: 1, limit: 50 });

    reviewRoutes = reviews.map((review) => ({
      url: `${baseUrl}/book/reviews/${review.id}`,
      lastModified: new Date(review.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to fetch reviews for sitemap:", error);
  }

  try {
    // 최신 판매글 50개를 가져와서 사이트맵에 추가
    const { sales } = await searchBookSales({ page: 1, limit: 50 });

    saleRoutes = sales.map((sale) => ({
      url: `${baseUrl}/book/sales/${sale.id}`,
      lastModified: sale.updatedAt ? new Date(sale.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to fetch sales for sitemap:", error);
  }

  return [...staticRoutes, ...reviewRoutes, ...saleRoutes];
}
