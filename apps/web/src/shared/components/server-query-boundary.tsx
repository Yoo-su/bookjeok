// publicApiClient/privateApiClient의 baseURL을 설정하는 사이드이펙트 임포트
//
// 빌드 타임 프리렌더에서는 레이아웃 모듈이 페이지 프리패치보다 먼저 평가된다는 보장이 없어
// baseURL이 undefined인 채로 요청이 실패할 수 있다.
// 프리패치를 수행하는 이 파일에서 직접 임포트해 렌더 방식과 무관하게 보장
import "@/shared/libs/axios";

import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  QueryFunction,
} from "@tanstack/react-query";
import { ReactNode } from "react";

import { getQueryClient } from "@/shared/libs/query-client";

type QueryConfig = {
  /** 실패 시 빈 HTML로 ISR을 교체하면 안 되는 페이지의 핵심 데이터. */
  required?: boolean;
} & (
  | {
      type?: "query";
      queryKey: readonly unknown[];
      queryFn: QueryFunction<unknown, readonly unknown[], never>;
    }
  | {
      type: "infinite";
      queryKey: readonly unknown[];
      queryFn: QueryFunction<unknown, readonly unknown[], any>;
      initialPageParam?: unknown;
    }
);

type ServerQueryBoundaryProps = {
  queries?: QueryConfig[];
  queryClient?: ReturnType<typeof getQueryClient>;
  children: ReactNode;
};

export async function ServerQueryBoundary({
  queries = [],
  queryClient: externalQueryClient,
  children,
}: ServerQueryBoundaryProps) {
  const queryClient = externalQueryClient || getQueryClient();

  const results = await Promise.allSettled(
    queries.map((q) => {
      if (q.type === "infinite") {
        return queryClient.fetchInfiniteQuery({
          queryKey: q.queryKey,
          queryFn: q.queryFn,
          initialPageParam: q.initialPageParam,
        });
      }
      return queryClient.fetchQuery({
        queryKey: q.queryKey,
        queryFn: q.queryFn,
      });
    }),
  );

  for (const [index, result] of results.entries()) {
    if (result.status !== "rejected") continue;
    console.error(
      `서버 데이터 조회 실패 [${JSON.stringify(queries[index].queryKey)}]:`,
      result.reason,
    );
    // Next가 재생성을 실패로 처리하여 기존 정상 ISR을 유지하게 한다.
    if (queries[index].required) throw result.reason;
  }

  return (
    <HydrationBoundary state={dehydrateStable(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

/**
 * 시각 필드를 0으로 고정한 dehydrate.
 * 재검증 결과가 이전과 같으면 Vercel은 ISR 쓰기를 과금하지 않는데, 시각이 섞이면 매번 달라진다.
 * 스냅샷은 대개 staleTime보다 오래돼 어차피 마운트 시 refetch되고, 기존 캐시는 덮어쓰지 않게 된다.
 */
export function dehydrateStable(queryClient: QueryClient): DehydratedState {
  const state = dehydrate(queryClient);
  return {
    ...state,
    queries: state.queries.map((query) =>
      // promise가 있는 스트리밍 쿼리는 hydrate가 dehydratedAt으로 신선도를 판단한다
      query.promise
        ? query
        : {
            ...query,
            dehydratedAt: 0,
            state: { ...query.state, dataUpdatedAt: 0 },
          },
    ),
  };
}
