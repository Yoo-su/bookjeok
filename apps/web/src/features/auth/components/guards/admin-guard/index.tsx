"use client";

import { ReactNode, useEffect } from "react";

import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useAuthStore } from "../../../stores/use-auth-store";
import { AuthGuard } from "../auth-guard";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * ADMIN만 접근할 수 있도록 보호하는 컴포넌트입니다.
 * 로그인하지 않은 사용자는 로그인 페이지로, ADMIN이 아닌 사용자는 홈으로 리다이렉트됩니다.
 * - 화면을 숨길 뿐이다. 실제 권한은 서버 AdminGuard가 막는다
 */
export const AdminGuard = ({ children }: AdminGuardProps) => (
  <AuthGuard>
    <AdminRoleCheck>{children}</AdminRoleCheck>
  </AuthGuard>
);

const AdminRoleCheck = ({ children }: AdminGuardProps) => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");

  useEffect(() => {
    if (!isAdmin) router.replace(PATHS.HOME);
  }, [router, isAdmin]);

  if (!isAdmin) return null;

  return children;
};
