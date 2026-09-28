"use client";

import { exchangeAuthTicket } from "@bookjeok/api-client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

/**
 * 소셜 로그인 콜백. 서버가 붙여 준 1회용 티켓을 토큰으로 교환합니다.
 *
 * URL로 토큰을 직접 받던 예전 방식은 받지 않습니다. 남겨 두면 공격자가 자기 토큰을 담은
 * 링크만으로 피해자를 공격자 계정에 로그인시킬 수 있습니다.
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const handleAuth = async () => {
      const ticket = searchParams.get("ticket");
      if (!ticket) {
        router.replace(PATHS.LOGIN);
        return;
      }

      try {
        const data = await exchangeAuthTicket(ticket);
        // 토큰과 사용자를 한 번에 바꾼다. 따로 넣으면 그 사이 이전 사용자 정보가 남는다
        setAuth(data);
        const returnUrl = consumeReturnUrl();
        router.replace(returnUrl || PATHS.HOME);
      } catch (error) {
        console.error("Failed to exchange auth ticket:", error);
        router.replace(PATHS.LOGIN);
      }
    };

    void handleAuth();
  }, [router, searchParams, setAuth]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
