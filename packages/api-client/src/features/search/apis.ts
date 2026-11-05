import { API_PATHS, SearchPreview } from "@bookjeok/core";

import { publicApiClient } from "../../client";

/**
 * 상단바 통합 검색 미리보기. 도서·리뷰·중고 판매글을 몇 건씩 함께 받습니다.
 * @param query 검색어 (2글자 이상)
 * @param signal 입력이 바뀌면 이전 요청을 끊는 데 씁니다
 */
export const getSearchPreview = async (
  query: string,
  signal?: AbortSignal,
): Promise<SearchPreview> => {
  const { data } = await publicApiClient.get<SearchPreview>(
    API_PATHS.search.preview,
    { params: { q: query }, signal },
  );
  return data;
};
