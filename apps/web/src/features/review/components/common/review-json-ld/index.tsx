import { cleanHtmlText, Review } from "@bookjeok/core";

import { JsonLd } from "@/shared/components/json-ld";

interface ReviewJsonLdProps {
  review: Review;
  locale?: string;
}

/**
 * 도서 리뷰의 구조화 데이터 (JSON-LD)
 * Google 리치 스니펫에 리뷰 작성자, 평점, 책 정보 등을 노출하기 위한 Review 스키마
 */
export function ReviewJsonLd({ review, locale = "ko" }: ReviewJsonLdProps) {
  // book 관계나 content가 빠진 응답이 실제로 나간 적이 있다. 구조화 데이터 한 블록이
  // 비는 것과 페이지가 500이 되는 것은 무게가 다르다. 500은 ISR에 안 남아 매 요청 재렌더된다.
  const book = review.book;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    url: `https://bookjeok.com/${locale}/book/reviews/${review.id}`,
    name: review.title,
    reviewBody: cleanHtmlText(review.content ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500), // HTML 태그 제거 및 500자 제한
    // 작성자가 붙인 태그. 리뷰의 주제를 본문 발췌보다 압축해 전달한다.
    ...(review.tags?.length && { keywords: review.tags.join(", ") }),
    datePublished: review.createdAt,
    dateModified: review.updatedAt,
    author: {
      "@type": "Person",
      name: review.user?.nickname || "Anonymous",
      // 프로필 이미지는 검색 엔진 노출 방지를 위해 제외
    },
    // 리뷰 평점 (평점이 있는 경우에만)
    ...(review.rating > 0 && {
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 0.5,
      },
    }),
    // 리뷰 대상 책 정보
    ...(book && {
      itemReviewed: {
        "@type": "Book",
        name: book.title,
        author: {
          "@type": "Person",
          name: book.author,
        },
        image: book.image,
        isbn: book.isbn,
        publisher: {
          "@type": "Organization",
          name: book.publisher,
        },
      },
    }),
    // 발행자 정보
    publisher: {
      "@type": "Organization",
      name: "bookjeok",
      url: "https://bookjeok.com",
    },
    // 인터랙션 통계
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ReadAction",
      userInteractionCount: review.viewCount,
    },
  };

  return <JsonLd data={jsonLd} />;
}
