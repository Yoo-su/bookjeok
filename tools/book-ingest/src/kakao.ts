import { fetchWithRetry } from "./http";

/** 카카오 책 검색 응답의 문서 한 건. 필드는 카카오가 주는 그대로입니다. */
export interface KakaoBook {
  authors: string[];
  contents: string;
  /** ISO 8601. 예: `2026-09-18T00:00:00.000+09:00`. 없으면 빈 문자열. */
  datetime: string;
  /** ISBN10·13을 공백으로 붙인 문자열. 한쪽이 빈 경우가 있습니다(`" 9788937449475"`). */
  isbn: string;
  /** 정가. 비도서는 0이 옵니다. */
  price: number;
  publisher: string;
  sale_price: number;
  /** `정상판매`·`예약판매`·`주문판매`·`""` 등. */
  status: string;
  /** `search1.kakaocdn.net/thumb/R120x174.q85/?fname=<원본 URL>` 형태. */
  thumbnail: string;
  title: string;
  translators: string[];
  url: string;
}

export interface KakaoPage {
  documents: KakaoBook[];
  meta: { is_end: boolean; pageable_count: number; total_count: number };
}

export type KakaoSearch = (
  publisher: string,
  page: number,
) => Promise<KakaoPage>;

export const KAKAO_PAGE_SIZE = 50;

/**
 * 출판사 검색이 돌려주는 페이지 상한. `pageable_count`가 최대 1,000(50×20)이고,
 * 21페이지 이후를 요청하면 **에러 없이 20페이지를 반복해** 돌려줍니다(2026-09-23 실측).
 * 페이지 번호로만 돌면 같은 책을 끝없이 받으므로 반드시 `is_end`와 이 상한으로 멈춥니다.
 */
export const KAKAO_MAX_PAGE = 20;

export function createKakaoSearch(apiKey: string): KakaoSearch {
  return async (publisher, page) => {
    const params = new URLSearchParams({
      query: publisher,
      target: "publisher",
      sort: "latest",
      size: String(KAKAO_PAGE_SIZE),
      page: String(page),
    });
    const res = await fetchWithRetry(
      `https://dapi.kakao.com/v3/search/book?${params}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } },
    );
    if (!res.ok) {
      throw new Error(
        `카카오 검색 실패 (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    return (await res.json()) as KakaoPage;
  };
}
