import {
  API_PATHS,
  BookInfo,
  DEFAULT_DISPLAY,
  DEFAULT_SORT,
  DEFAULT_START,
  GetBookDetailResponseData,
  GetBookListParams,
  GetBookListSuccessResponse,
} from "@bookjeok/core";
import axios from "axios";
import { cache } from "react";

import { config } from "@/shared/config/env";
import { TtlLruCache } from "@/shared/utils/ttl-lru-cache";

// 서버 인메모리 캐시 (10분 유효)
//
// 상한을 두는 이유: 크롤러가 훑는 ISBN 수가 카탈로그 크기(5만+)라
// eviction 없는 Map은 인스턴스 수명 내내 늘기만 한다.
const CACHE_TTL_MS = 10 * 60 * 1000;
const DETAIL_CACHE_MAX = 500;
const LIST_CACHE_MAX = 200;

const bookDetailCache = new TtlLruCache<GetBookDetailResponseData>(
  DETAIL_CACHE_MAX,
  CACHE_TTL_MS,
);
const bookListCache = new TtlLruCache<GetBookListSuccessResponse>(
  LIST_CACHE_MAX,
  CACHE_TTL_MS,
);

/**
 * SSR/ISR에서 쓰는 백엔드 주소. 내부망 주소를 우선하고 없으면 공개 주소로 폴백합니다.
 * `shared/libs/axios`는 클라이언트 스토어를 끌어오므로 서버 전용 모듈에서는 쓰지 않습니다.
 */
const apiBaseUrl =
  process.env.API_URL || config.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** 서버 응답의 `{ success, data }` 포장을 벗긴다. */
function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    (payload as { success?: unknown }).success === true &&
    (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/**
 * 백엔드가 돌려준 도서 목록 응답이 쓸 수 있는 형태인지 확인한다.
 *
 * 외부 공급처는 키 오류나 쿼터 초과도 HTTP 200으로 응답하는 경우가 있다.
 * `items` 부재를 "책 없음"으로 흘리면 호출부가 notFound()를 띄우고 그 404가
 * ISR 캐시에 24시간 고착되므로, 장애는 장애로 터뜨린다.
 */
function assertBookListShape(
  data: unknown,
  context: string,
): asserts data is GetBookDetailResponseData {
  if (!data || !Array.isArray((data as { items?: unknown }).items)) {
    throw new Error(
      `${context}: 응답에 items가 없습니다: ${JSON.stringify(data).slice(0, 200)}`,
    );
  }
}

/**
 * 서버 컴포넌트 전용: 백엔드를 통해 도서 목록을 조회합니다.
 * 외부 공급처 호출은 백엔드가 전담하므로 여기서는 직접 호출하지 않습니다.
 */
export const getBookListServer = async (
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const display = params.display ?? DEFAULT_DISPLAY;
  const start = params.start ?? DEFAULT_START;
  const sort = params.sort ?? DEFAULT_SORT;
  const queryType = params.queryType ?? "Keyword";

  const cacheKey = `${params.query}:${display}:${start}:${sort}:${queryType}`;
  const cached = bookListCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${apiBaseUrl}${API_PATHS.book.list}`, {
      params: { query: params.query, display, start, sort, queryType },
    });

    const data = unwrap<GetBookListSuccessResponse>(response.data);
    assertBookListShape(data, "도서 목록 조회");

    bookListCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("서버에서 책 목록 조회 실패:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "책 목록을 가져오는 데 실패했습니다.",
    );
  }
};

/**
 * 서버 전용: 출판사별 책 목록을 가져와 BookInfo[] 형태로 반환합니다.
 * prefetch queryFn에서 사용하기 위한 헬퍼 함수입니다.
 */
export const getPublisherBooksServer = async (
  publisher: string,
  display: number = 10,
): Promise<BookInfo[]> => {
  const result = await getBookListServer({ query: publisher, display });
  return result.items || [];
};

/**
 * 서버 전용: 백엔드를 통해 도서 상세정보를 조회합니다.
 * React Cache 및 인메모리 캐시를 사용하여 중복 요청을 방지합니다.
 */
export const fetchBookDetail = cache(async (isbn: string) => {
  const cached = bookDetailCache.get(isbn);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${apiBaseUrl}${API_PATHS.book.detail}`, {
      params: { isbn },
    });

    const data = unwrap<GetBookDetailResponseData>(response.data);
    assertBookListShape(data, "도서 상세 조회");

    bookDetailCache.set(isbn, data);
    return data;
  } catch (error) {
    console.error("책 상세정보 조회 실패:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "책 상세정보를 가져오는 데 실패했습니다.",
    );
  }
});
