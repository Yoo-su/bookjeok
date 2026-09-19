import { cleanHtmlText, Review } from "@bookjeok/core";

export function getReviewShareDescription(review: Review): string {
  const bookLabel = review.book
    ? `${review.book.title} - ${review.book.author}`
    : review.title;
  // 작성자 브라우저에는 비공개 원문이 있으므로 SDK 공유에서도 직접 가린다.
  const excerpt = review.isPublic
    ? cleanHtmlText(review.content ?? "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const description = excerpt ? `${bookLabel} | ${excerpt}` : bookLabel;
  return description.length > 160
    ? `${description.slice(0, 159).trimEnd()}…`
    : description;
}
