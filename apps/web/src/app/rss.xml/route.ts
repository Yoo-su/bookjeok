import "@/shared/libs/axios";

import { getRecentBookSales, getReviews } from "@bookjeok/api-client";
import { Review, UsedBookSale } from "@bookjeok/core";

// 봇이 칠 때마다 함수를 깨우고 백엔드를 두 번 치던 자리.
// 내용은 목록 상위 50건이라 6시간 단위로 굳혀도 색인에 영향이 없다.
export const revalidate = 21600; // 6시간

export async function GET() {
  let reviews: Review[] = [];
  let sales: UsedBookSale[] = [];

  // 1. 병렬 비동기 조회 및 개별 예외 처리 (API 에러 시 대비)
  try {
    const res = await getReviews({ page: 1, limit: 10 });
    reviews = res.reviews || [];
  } catch (e) {
    console.error("Failed to fetch reviews for RSS feed:", e);
  }

  try {
    const resSales = await getRecentBookSales();
    sales = Array.isArray(resSales) ? resSales.slice(0, 10) : [];
  } catch (e) {
    console.error("Failed to fetch recent sales for RSS feed:", e);
  }

  // 2. 피드 규격에 맞는 데이터 정제
  const feedItems = [
    ...reviews.map((r) => ({
      title: `[도서리뷰] ${r.book?.title || "도서"} - ${r.title}`,
      link: `https://bookjeok.com/ko/book/reviews/${r.id}`,
      description: r.content,
      pubDate: new Date(r.createdAt),
    })),
    ...sales.map((s) => ({
      title: `[중고도서] ${s.book?.title || "도서"} - ${s.title} (${s.price.toLocaleString()}원)`,
      link: `https://bookjeok.com/ko/book/sales/${s.id}`,
      description: s.content,
      pubDate: new Date(s.createdAt),
    })),
  ];

  // 3. 날짜 역순(최신순) 정렬
  feedItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // 4. RSS Item XML 생성
  const xmlItems = feedItems
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <guid isPermaLink="true">${item.link}</guid>
    </item>`,
    )
    .join("");

  // 5. 전체 RSS 2.0 XML 문서 조립
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>북적 - 독서 기록, 리뷰, 중고 거래</title>
    <link>https://bookjeok.com/ko</link>
    <description>독서 기록을 관리하고, 도서 리뷰를 공유하며, 중고책을 안전하게 거래하는 플랫폼 북적의 최신 소식입니다.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://bookjeok.com/rss.xml" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
