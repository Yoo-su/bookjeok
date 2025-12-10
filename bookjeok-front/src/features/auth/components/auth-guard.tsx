"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { PATHS } from "@/shared/constants/paths";

import { useAuthStore } from "../store";

interface AuthGuardProps {
  children: ReactNode;
}
/**
 * 인증된 사용자만 접근할 수 있도록 보호하는 컴포넌트입니다.
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace(PATHS.LOGIN);
      return;
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return children;
};
