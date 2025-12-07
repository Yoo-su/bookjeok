import { MetadataRoute } from "next";

import { getReviews } from "@/features/review/apis";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://releaf-hub.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/book/market`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/review`,
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

  try {
    // 최신 리뷰 50개를 가져와서 사이트맵에 추가
    const { reviews } = await getReviews({ page: 1, limit: 50 });

    const reviewRoutes: MetadataRoute.Sitemap = reviews.map((review) => ({
      url: `${baseUrl}/book/reviews/${review.id}`,
      lastModified: new Date(review.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...reviewRoutes];
  } catch (error) {
    console.error("Failed to fetch reviews for sitemap:", error);
    return staticRoutes;
  }
}
