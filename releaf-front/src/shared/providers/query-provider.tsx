"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";

import { queryClient } from "@/shared/constants/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  // QueryClient를 state로 관리하여 리렌더링 시 새로운 인스턴스 생성 방지
  const [queryClientState] = useState(() => queryClient);

  return (
    <QueryClientProvider client={queryClientState}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
