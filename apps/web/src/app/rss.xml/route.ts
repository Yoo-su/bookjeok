import "@/shared/libs/axios";

import { getRecentBookSales, getReviews } from "@bookjeok/api-client";
import { cleanHtmlText, Review, UsedBookSale } from "@bookjeok/core";

// 봇이 칠 때마다 함수를 깨우고 백엔드를 두 번 치던 자리.
// 내용은 목록 상위 60건이라 6시간 단위로 굳혀도 색인에 영향이 없다.
export const revalidate = 21600; // 6시간

/**
 * 종류별 발행 건수.
 *
 * 네이버 웹마스터도구는 신규 웹문서 수집 소스로 RSS를 쓰는데, 6시간 주기로
 * 굳히는 피드에 10건씩만 실으면 그 사이 쏟아진 글이 피드에 오르지도 못하고
 * 밀려난다. 응답은 어차피 6시간에 한 번 만들어지므로 늘려도 비용이 없다.
 */
const ITEMS_PER_SOURCE = 30;

/** 구글·네이버 모두 설명은 200자 안쪽에서 자른다. */
const DESCRIPTION_MAX_LENGTH = 200;

/** CDATA 안에서는 `]]>`만이 유일한 탈출 문자열이다. 만나면 두 섹션으로 쪼갠다. */
const cdata = (text: string) =>
  `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** 본문 HTML을 스니펫용 한 줄 텍스트로 만든다. */
const toSnippet = (content?: string | null) => {
  const text = cleanHtmlText(content).replace(/\s+/g, " ").trim();
  return text.length > DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`
    : text;
};

export async function GET() {
  let reviews: Review[] = [];
  let sales: UsedBookSale[] = [];

  // 1. 병렬 비동기 조회 및 개별 예외 처리 (API 에러 시 대비)
  const [reviewResult, salesResult] = await Promise.allSettled([
    getReviews({ page: 1, limit: ITEMS_PER_SOURCE }),
    getRecentBookSales(ITEMS_PER_SOURCE),
  ]);

  if (reviewResult.status === "fulfilled") {
    reviews = reviewResult.value.reviews || [];
  } else {
    console.error("Failed to fetch reviews for RSS feed:", reviewResult.reason);
  }

  if (salesResult.status === "fulfilled") {
    sales = Array.isArray(salesResult.value)
      ? salesResult.value.slice(0, ITEMS_PER_SOURCE)
      : [];
  } else {
    console.error(
      "Failed to fetch recent sales for RSS feed:",
      salesResult.reason,
    );
  }

  // 2. 피드 규격에 맞는 데이터 정제
  const feedItems = [
    ...reviews.map((r) => ({
      title: `[도서리뷰] ${r.book?.title || "도서"} - ${r.title}`,
      link: `https://bookjeok.com/ko/book/reviews/${r.id}`,
      description: toSnippet(r.content),
      // 태그를 카테고리로 함께 싣는다. 네이버가 RSS를 신규 웹문서 수집
      // 소스로 쓰는데, 고정값 하나만 실으면 글마다 주제 구분이 없다.
      categories: ["도서리뷰", ...(r.tags ?? [])],
      pubDate: new Date(r.createdAt),
    })),
    ...sales.map((s) => ({
      title: `[중고도서] ${s.book?.title || "도서"} - ${s.title} (${s.price.toLocaleString()}원)`,
      link: `https://bookjeok.com/ko/book/sales/${s.id}`,
      description: toSnippet(s.content),
      categories: ["중고도서"],
      pubDate: new Date(s.createdAt),
    })),
  ];

  // 3. 날짜 역순(최신순) 정렬
  feedItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // 4. RSS Item XML 생성
  //
  // 제목·본문은 사용자 입력이라 전부 CDATA로 감싼다. 이전에는 리뷰 본문
  // HTML이 그대로 실려 스니펫에 태그가 보였다.
  const xmlItems = feedItems
    .map(
      (item) => `
    <item>
      <title>${cdata(item.title)}</title>
      <link>${item.link}</link>
      <description>${cdata(item.description)}</description>
      ${item.categories.map((category) => `<category>${cdata(category)}</category>`).join("")}
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
