import { publicApiClient } from "@bookjeok/api-client";
import {
  API_PATHS,
  SEARCH_PREVIEW_LIMITS,
  type SearchPreview,
  type SearchPreviewBook,
  type SearchPreviewReview,
  type SearchPreviewSale,
} from "@bookjeok/core";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

/** 스토리용. 도서는 운영 서지(공개 정보), 리뷰·판매글·닉네임은 지어낸 것 */
const BOOKS: Omit<SearchPreviewBook, "reviewCount" | "saleCount">[] = [
  [
    "9788936434410",
    "소년이 온다 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
    "한강",
    "창비",
  ],
  [
    "9788954682152",
    "작별하지 않는다 (한강 소설ㅣ2024년 노벨문학상 수상작가 l 2023년 메디치 외국문학상 수상)",
    "한강",
    "문학동네",
  ],
  [
    "9788936434595",
    "채식주의자 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
    "한강",
    "창비",
  ],
  [
    "9788932043562",
    "빛과 실 (2024 노벨문학상 수상 강연문 수록)",
    "한강",
    "문학과지성사",
  ],
  [
    "9788932024639",
    "서랍에 저녁을 넣어 두었다 (한강 시집ㅣ2024년 노벨문학상 수상작가)",
    "한강",
    "문학과지성사",
  ],
  [
    "9788954616515",
    "희랍어 시간 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
    "한강",
    "문학동네",
  ],
  ["9791141601713", "흰 (한강 소설)", "한강", "문학동네"],
  [
    "9788932020006",
    "바람이 분다, 가라 - 2024 노벨문학상 수상작가, 제13회 동리문학상 수상작",
    "한강",
    "문학과지성사",
  ],
  [
    "9788954648905",
    "검은 사슴 - 2024 노벨문학상 수상작가, 한강 장편소설",
    "한강",
    "문학동네",
  ],
  ["9788937460449", "데미안", "헤르만헤세", "민음사"],
].map(([isbn, title, author, publisher]) => ({
  isbn,
  title,
  author,
  publisher,
  image: `https://cdn.bookjeok.com/covers/${isbn}.webp`,
}));

const REVIEWS: (SearchPreviewReview & { isbn: string; content: string })[] = [
  {
    id: 101,
    isbn: "9788936434410",
    title: "소년이 온다를 읽고 한동안 잠을 못 잤다",
    content:
      "읽는 내내 숨을 고르게 쉬기 어려웠다. 한강의 문장은 조용한데 끝까지 따라온다. 동호의 이야기가 오래 남는다.",
    rating: 5,
    nickname: "새벽독서",
    bookTitle: "소년이 온다 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
  },
  {
    id: 102,
    isbn: "9788954682152",
    title: "눈 내리는 제주에서 다시 읽은 작별하지 않는다",
    content:
      "겨울에 읽어야 하는 책이라는 말이 무슨 뜻인지 알았다. 한강 작가가 그리는 눈은 차갑지 않고 무겁다.",
    rating: 4.5,
    nickname: "책먼지",
    bookTitle:
      "작별하지 않는다 (한강 소설ㅣ2024년 노벨문학상 수상작가 l 2023년 메디치 외국문학상 수상)",
  },
  {
    id: 103,
    isbn: "9788937460449",
    title: "스무 살에 다시 펼친 데미안",
    content:
      "새는 알에서 나오려고 투쟁한다는 문장만 알고 있었는데, 다시 읽으니 싱클레어의 불안이 먼저 보였다.",
    rating: 4,
    nickname: "밑줄수집가",
    bookTitle: "데미안",
  },
  {
    id: 104,
    isbn: "9788936434595",
    title: "불편해서 좋은 책, 채식주의자",
    content:
      "영혜를 둘러싼 사람들의 시선이 내 시선과 닮아 있어서 불편했다. 그래서 한강의 소설은 다시 읽게 된다.",
    rating: 4,
    nickname: "오후세시",
    bookTitle: "채식주의자 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
  },
].map((r) => ({ ...r, snippet: r.content }));

const SALES: (SearchPreviewSale & { isbn: string })[] = [
  {
    id: 201,
    isbn: "9788936434410",
    title: "소년이 온다 밑줄 없음, 상태 최상",
    price: 9000,
    status: "FOR_SALE",
    image: "https://cdn.bookjeok.com/covers/9788936434410.webp",
    bookTitle: "소년이 온다 (한강 소설ㅣ2024년 노벨문학상 수상작가)",
    region: "서울 마포구",
  },
  {
    id: 202,
    isbn: "9788937460449",
    title: "민음사 세계문학 데미안",
    price: 5000,
    status: "RESERVED",
    image: "https://cdn.bookjeok.com/covers/9788937460449.webp",
    bookTitle: "데미안",
    region: "경기 성남시",
  },
  {
    id: 203,
    isbn: "9791141601713",
    title: "흰 양장본 한 번 읽음",
    price: 11000,
    status: "FOR_SALE",
    image: "https://cdn.bookjeok.com/covers/9791141601713.webp",
    bookTitle: "흰 (한강 소설)",
    region: "부산 해운대구",
  },
];

export const SAMPLE_POPULAR_KEYWORDS = [
  "한강",
  "데미안",
  "불편한 편의점",
  "아몬드",
  "파친코",
  "사피엔스",
].map((keyword, i) => ({ keyword, searchCount: 120 - i * 17 }));

const PREVIEW_LIMITS = SEARCH_PREVIEW_LIMITS;

const matches = (query: string, ...fields: string[]) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = fields.join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
};

export const buildSamplePreview = (query: string): SearchPreview => {
  const books = BOOKS.filter((b) =>
    matches(query, b.title, b.author, b.publisher),
  ).map((b) => ({
    ...b,
    reviewCount: REVIEWS.filter((r) => r.isbn === b.isbn).length,
    saleCount: SALES.filter((s) => s.isbn === b.isbn).length,
  }));
  const reviews = REVIEWS.filter((r) =>
    matches(query, r.title, r.content, r.bookTitle, r.nickname),
  ).map(({ isbn: _isbn, content, ...r }) => {
    // 서버가 검색어 주변을 잘라 주는 것을 흉내 낸다
    const at = content.indexOf(query.split(/\s+/)[0]);
    const start = Math.max(0, at - 12);
    return { ...r, snippet: (start > 0 ? "…" : "") + content.slice(start) };
  });
  const sales = SALES.filter((s) => matches(query, s.title, s.bookTitle)).map(
    ({ isbn: _isbn, ...s }) => s,
  );

  return {
    books: { items: books.slice(0, PREVIEW_LIMITS.books), total: books.length },
    reviews: {
      items: reviews.slice(0, PREVIEW_LIMITS.reviews),
      total: reviews.length,
    },
    sales: { items: sales.slice(0, PREVIEW_LIMITS.sales), total: sales.length },
  };
};

export interface SearchPreviewMockOptions {
  /** 응답 지연(ms). 입력 중 흐려지는 모습을 보려면 400 이상 */
  delay?: number;
  /** loading: 응답하지 않음. error: 500 */
  mode?: "ok" | "loading" | "error";
}

/**
 * `publicApiClient`가 미리보기·인기 검색어를 가짜로 받게 바꾼다.
 * 스토리 `beforeEach`에서 부르고 돌려받은 함수로 되돌린다.
 */
export const installSearchPreviewMock = ({
  delay = 350,
  mode = "ok",
}: SearchPreviewMockOptions = {}) => {
  const original = publicApiClient.defaults.adapter;

  const respond = (
    config: InternalAxiosRequestConfig,
    data: unknown,
    status = 200,
  ) =>
    new Promise<Awaited<ReturnType<AxiosAdapter>>>((resolve, reject) => {
      const id = window.setTimeout(() => {
        const response = { data, status, statusText: "", headers: {}, config };
        if (status >= 400)
          reject(Object.assign(new Error(`HTTP ${status}`), { response }));
        else resolve(response);
      }, delay);
      config.signal?.addEventListener?.("abort", () => window.clearTimeout(id));
    });

  const adapter: AxiosAdapter = (config) => {
    if (config.url === API_PATHS.searchKeyword.popular) {
      return respond(config, SAMPLE_POPULAR_KEYWORDS);
    }
    if (config.url === API_PATHS.search.preview) {
      if (mode === "loading") return new Promise(() => {});
      if (mode === "error") return respond(config, null, 500);
      return respond(
        config,
        buildSamplePreview(String(config.params?.q ?? "")),
      );
    }
    return respond(config, null, 404);
  };

  publicApiClient.defaults.adapter = adapter;
  return () => {
    publicApiClient.defaults.adapter = original;
  };
};
