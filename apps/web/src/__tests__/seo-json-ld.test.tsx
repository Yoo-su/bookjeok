import { BookInfo, Review, SaleStatus, UsedBookSale } from "@bookjeok/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BookSaleJsonLd } from "@/features/book-sale/components/common/book-sale-json-ld";
import { getBookSaleShareData } from "@/features/book-sale/utils/share";
import { ReviewJsonLd } from "@/features/review/components/common/review-json-ld";
import { getReviewShareDescription } from "@/features/review/utils/share";

const book: BookInfo = {
  isbn: "9791167376442",
  title: "테스트 도서",
  author: "저자",
  publisher: "출판사",
  image: "https://cdn.bookjeok.com/covers/9791167376442.webp",
  description: "소개",
  discount: "10000",
};
const user = {
  id: 1,
  handle: "reader",
  nickname: "독자",
  profileImageUrl: null,
};
const sale: UsedBookSale = {
  id: 1,
  title: "판매글",
  price: 5000,
  city: "서울",
  district: "마포구",
  content: "상태 좋음",
  imageUrls: [],
  status: SaleStatus.SOLD,
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
  user,
  book,
  viewCount: 0,
};
const review: Review = {
  id: 1,
  title: "감상",
  content: "<p>첫 문장 &amp; 감상</p>",
  isbn: book.isbn,
  rating: 0.5,
  tags: [],
  category: "소설",
  viewCount: 0,
  userId: 1,
  isPublic: true,
  user,
  book,
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
};

function jsonLd(element: React.ReactElement) {
  const { container, unmount } = render(element);
  const data = JSON.parse(container.querySelector("script")!.textContent!);
  unmount();
  return data;
}

describe("검색봇에 전달하는 실제 JSON-LD", () => {
  it("작성자 비공개 원문은 공유 설명에 포함하지 않는다", () => {
    expect(getReviewShareDescription({ ...review, isPublic: false })).toBe(
      "테스트 도서 - 저자",
    );
    expect(getReviewShareDescription(review)).toContain("첫 문장 & 감상");
  });

  it("공유 설명에 거래 상태와 지역을 함께 전달한다", () => {
    expect(getBookSaleShareData(sale, "ko", "원", "판매완료").description).toBe(
      "테스트 도서 | 5,000원 | 판매완료 | 서울 마포구",
    );
  });
  it.each([
    [SaleStatus.FOR_SALE, "InStock"],
    [SaleStatus.RESERVED, "LimitedAvailability"],
    [SaleStatus.SOLD, "SoldOut"],
  ])("판매 상태 %s를 반영한다", (status, availability) => {
    const data = jsonLd(<BookSaleJsonLd sale={{ ...sale, status }} />);
    expect(data.offers.availability).toBe(`https://schema.org/${availability}`);
    expect(data.offers).not.toHaveProperty("priceValidUntil");
    expect(data).not.toHaveProperty("brand");
  });

  it("0.5점이 선언한 평가 범위 안에 있다", () => {
    const data = jsonLd(<ReviewJsonLd review={review} />);
    expect(data.reviewRating.worstRating).toBeLessThanOrEqual(0.5);
    expect(data.reviewRating.ratingValue).toBe(0.5);
    expect(data.reviewBody).toBe("첫 문장 & 감상");
  });

  it("작성자가 붙인 태그를 keywords로 전달한다", () => {
    const data = jsonLd(
      <ReviewJsonLd review={{ ...review, tags: ["카뮈", "부조리"] }} />,
    );
    expect(data.keywords).toBe("카뮈, 부조리");
  });

  it("태그가 없으면 keywords를 만들지 않는다", () => {
    expect(jsonLd(<ReviewJsonLd review={review} />)).not.toHaveProperty(
      "keywords",
    );
  });

  it("미선택 별점 0에는 평점 마크업을 만들지 않는다", () => {
    expect(
      jsonLd(<ReviewJsonLd review={{ ...review, rating: 0 }} />),
    ).not.toHaveProperty("reviewRating");
  });
});
