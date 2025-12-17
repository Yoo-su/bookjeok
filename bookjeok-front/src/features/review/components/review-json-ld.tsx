import { Review } from "../types";

interface ReviewJsonLdProps {
  review: Review;
}

/**
 * 도서 리뷰의 구조화 데이터 (JSON-LD)
 * Google 리치 스니펫에 리뷰 작성자, 평점, 책 정보 등을 노출하기 위한 Review 스키마
 */
export function ReviewJsonLd({ review }: ReviewJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.content.replace(/<[^>]*>/g, "").slice(0, 500), // HTML 태그 제거 및 500자 제한
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
        worstRating: 1,
      },
    }),
    // 리뷰 대상 책 정보
    itemReviewed: {
      "@type": "Book",
      name: review.book.title,
      author: {
        "@type": "Person",
        name: review.book.author,
      },
      image: review.book.image,
      isbn: review.book.isbn,
      publisher: {
        "@type": "Organization",
        name: review.book.publisher,
      },
    },
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
