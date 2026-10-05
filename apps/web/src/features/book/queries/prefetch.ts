import { getSavedBookSummary } from "@bookjeok/api-client";
import { bookKeys } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

/**
 * AI 도서 요약 정보 프리패칭 (서버 사이드)
 * 조회 실패는 에러 상태라 시드에서 빠지고, 클라이언트가 마운트 시 다시 조회합니다.
 */
export const prefetchBookSummary = async (
  queryClient: QueryClient,
  isbn: string,
) => {
  if (!isbn) return;

  return queryClient.prefetchQuery({
    queryKey: bookKeys.summary(isbn).queryKey,
    queryFn: () => getSavedBookSummary(isbn),
    // 부가 데이터라 TTFB에 재시도 지연을 더하지 않음
    retry: false,
  });
};
