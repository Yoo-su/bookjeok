import type { Candidate } from "../normalize";
import type { ListCatalog } from "../sources";
import type { KakaoBook } from "../sources/kakao";

const COVER =
  "http://t1.daumcdn.net/lbook/image/7309964?timestamp=20260922121507";

/** 2026-09-23 실측 응답과 같은 모양의 카카오 문서. */
export function kakaoBook(overrides: Partial<KakaoBook> = {}): KakaoBook {
  return {
    authors: ["이서수"],
    contents:
      "이서수 장편소설 『우리 착한 나진』이 민음사 ‘오늘의 젊은 작가’ 시리즈로",
    datetime: "2026-09-18T00:00:00.000+09:00",
    isbn: "8937477513 9788937477515",
    price: 15000,
    publisher: "민음사",
    sale_price: 13500,
    status: "정상판매",
    thumbnail: `https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=${encodeURIComponent(COVER)}`,
    title: "우리 착한 나진",
    translators: [],
    url: "https://search.daum.net/search?w=bookpage&bookId=7309964",
    ...overrides,
  };
}

export function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    source: "kakao",
    isbn: "9788937477515",
    isbn10: "8937477513",
    title: "우리 착한 나진",
    author: "이서수",
    translators: [],
    publisher: "민음사",
    discount: "15000",
    pubDate: "2026-09-18",
    description: "소개",
    coverUrls: [COVER],
    thumbnail: kakaoBook().thumbnail,
    salesPoint: null,
    status: "정상판매",
    category: null,
    link: kakaoBook().url,
    preorder: false,
    dimensions: null,
    raw: kakaoBook(),
    ...overrides,
  };
}

/** 목록 테스트용 카탈로그. 알라딘 카탈로그를 쓰지 않아 알라딘을 지워도 공통 테스트가 남습니다. */
export const LIST_CATALOG: ListCatalog = {
  maxPages: 20,
  types: [
    { id: "Bestseller", label: "베스트셀러", dated: true },
    { id: "BlogBest", label: "블로거 베스트", dated: false },
  ],
  categories: [
    { id: "0", label: "종합" },
    { id: "1", label: "소설/시/희곡" },
    { id: "74", label: "역사" },
    { id: "170", label: "경제경영" },
    { id: "336", label: "자기계발" },
  ],
  since: 2000,
};
