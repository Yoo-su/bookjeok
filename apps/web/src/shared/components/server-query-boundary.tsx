// publicApiClient/privateApiClient의 baseURL을 설정하는 사이드이펙트 임포트
//
// 빌드 타임 프리렌더에서는 레이아웃 모듈이 페이지 프리패치보다 먼저 평가된다는 보장이 없어
// baseURL이 undefined인 채로 요청이 실패할 수 있다.
// 프리패치를 수행하는 이 파일에서 직접 임포트해 렌더 방식과 무관하게 보장
import "@/shared/libs/axios";

import {
  dehydrate,
  HydrationBoundary,
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
