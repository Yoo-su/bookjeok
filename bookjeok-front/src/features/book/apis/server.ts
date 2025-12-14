import axios from "axios";

import {
  DEFAULT_DISPLAY,
  DEFAULT_SORT,
  DEFAULT_START,
} from "@/features/book/constants";
import {
  BookInfo,
  GetBookListErrorResponse,
  GetBookListParams,
  GetBookListSuccessResponse,
} from "@/features/book/types";

/**
 * 서버 컴포넌트 전용: 네이버 책 검색 API를 직접 호출합니다.
 * 서버에서는 CORS가 적용되지 않으므로 직접 호출이 가능합니다.
 * @param params 검색 파라미터
 * @returns 책 목록 또는 에러 응답
 */
export const getBookListServer = async (
  params: GetBookListParams
): Promise<GetBookListSuccessResponse | GetBookListErrorResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/book.json",
      {
        params: {
          query: params.query,
          display: displayParam,
          start: startParam,
          sort: sortParam,
        },
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    return {
      success: true,
      ...response.data,
    } as GetBookListSuccessResponse;
  } catch (error) {
    console.error("서버에서 책 목록 조회 실패:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "책 목록을 가져오는 데 실패했습니다.",
    } as GetBookListErrorResponse;
  }
};

/**
 * 서버 전용: 출판사별 책 목록을 가져와 BookInfo[] 형태로 반환합니다.
 * prefetch queryFn에서 사용하기 위한 헬퍼 함수입니다.
 */
export const getPublisherBooksServer = async (
  publisher: string,
  display: number = 10
): Promise<BookInfo[]> => {
  const result = await getBookListServer({ query: publisher, display });
  if (!result.success) return [];
  return result.items;
};
