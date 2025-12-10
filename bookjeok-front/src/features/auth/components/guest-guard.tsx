"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { PATHS } from "@/shared/constants/paths";

import { useAuthStore } from "../store";

interface GuestGuardProps {
  children: ReactNode;
}
export const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push(PATHS.HOME);
      return;
    }
  }, [user, router]);

  // 유저가 인증되었다면 리다이렉트되므로, null이나 로더를 반환합니다.
  // 그렇지 않다면 children을 렌더링합니다. 이는 리다이렉트 전에 로그인 페이지가 잠시 렌더링되는 것을 방지합니다.
  if (user) {
    return null; // 또는 로딩 스피너
  }

  return children;
};
