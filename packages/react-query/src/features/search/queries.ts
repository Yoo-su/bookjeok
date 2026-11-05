import { getSearchPreview } from "@bookjeok/api-client";
import { SEARCH_PREVIEW_MIN_LENGTH, searchKeys } from "@bookjeok/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * 상단바 통합 검색 미리보기. 입력 중에 부르므로 새 결과가 오기 전까지 직전 결과를 남긴다.
 * 짧은 검색어는 부르지 않는다.
 */
export const useSearchPreviewQuery = (query: string) =>
  useQuery({
    queryKey: searchKeys.preview(query).queryKey,
    queryFn: ({ signal }) => getSearchPreview(query, signal),
    enabled: query.length >= SEARCH_PREVIEW_MIN_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
