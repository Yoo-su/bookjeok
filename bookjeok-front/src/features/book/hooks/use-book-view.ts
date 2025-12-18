"use client";

import { useEffect, useRef } from "react";

import { recordBookView } from "../apis";

/**
 * 책 상세페이지 조회수를 기록하는 훅
 * - 컴포넌트 마운트 시 한 번만 호출
 * - IP 기반 24시간 중복 방지는 백엔드에서 처리
 * @param isbn 책 ISBN
 */
export const useBookView = (isbn: string) => {
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // StrictMode에서 두 번 호출되는 것 방지
    if (hasCalledRef.current || !isbn) {
      return;
    }

    hasCalledRef.current = true;

    // 조회수 기록 API 호출 (실패해도 무시)
    recordBookView(isbn).catch((error) => {
      // 조회수 기록 실패는 사용자 경험에 영향 없으므로 조용히 무시
      console.warn("책 조회수 기록 실패:", error);
    });
  }, [isbn]);
};
