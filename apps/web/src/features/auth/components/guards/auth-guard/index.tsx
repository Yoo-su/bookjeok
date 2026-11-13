"use client";

import { ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useAuthStore } from "../../../stores/use-auth-store";
import { saveCurrentReturnUrl } from "../../../utils/return-url";

interface AuthGuardProps {
  children: ReactNode;
}
/**
 * 인증된 사용자만 접근할 수 있도록 보호하는 컴포넌트입니다.
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      saveCurrentReturnUrl();
      router.replace(PATHS.LOGIN);
      return;
    }
  }, [router, pathname, user]);

  if (!user) {
    return null;
  }

  return children;
};
