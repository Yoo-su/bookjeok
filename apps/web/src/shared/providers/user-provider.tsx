"use client";

import { getUserProfile } from "@bookjeok/api-client";
import { ReactNode, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveCurrentReturnUrl } from "@/features/auth/utils/return-url";
import { FullScreenLoader } from "@/shared/components/ui/full-screen-loader";
import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const refreshRestoredSession = async (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const previous = useAuthStore.getState();
      await useAuthStore.persist.rehydrate();
      const current = useAuthStore.getState();
      if (
        previous.user?.id !== current.user?.id ||
        !!previous.accessToken !== !!current.accessToken
      ) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", refreshRestoredSession);
    return () => window.removeEventListener("pageshow", refreshRestoredSession);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUserProfile = async () => {
      if (accessToken) {
        try {
          const user = await getUserProfile();
          if (active) setUser(user);
        } catch {
          // 인증 실패는 세션 갱신 및 종료 처리에서 다룬다.
        } finally {
          if (active) setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (isHydrated) {
      void fetchUserProfile();
    }
    return () => {
      active = false;
    };
  }, [accessToken, setUser, isHydrated]);

  const isPrivateRoute = (path: string | null): boolean => {
    if (!path) return false;
    const paymentEnabled =
      process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";
    const isOrder =
      paymentEnabled &&
      path.startsWith(PATHS.ORDER_DETAIL("")) &&
      path !== PATHS.ORDER_PAYMENT_SUCCESS &&
      path !== PATHS.ORDER_PAYMENT_FAIL;
    return (
      isOrder ||
      path === PATHS.MY_PAGE ||
      path.startsWith(PATHS.MY_PAGE + "/") ||
      path === PATHS.ADMIN_FEEDBACK ||
      path === PATHS.BOOK_SALES_REGISTER ||
      path === PATHS.REVIEW_WRITE ||
      path.endsWith("/edit")
    );
  };

  useEffect(() => {
    if (isHydrated && !isLoading && !accessToken && isPrivateRoute(pathname)) {
      saveCurrentReturnUrl();
      router.replace(PATHS.LOGIN);
    }
  }, [isHydrated, isLoading, accessToken, pathname, router]);

  const shouldBlock =
    isPrivateRoute(pathname) && (isLoading || !isHydrated || !accessToken);

  if (shouldBlock) return <FullScreenLoader />;
  return <>{children}</>;
}
