"use client";

import { getUserProfile } from "@bookjeok/api-client";
import { ReactNode, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
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
    const fetchUserProfile = async () => {
      if (accessToken) {
        try {
          const user = await getUserProfile();
          setUser(user);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (isHydrated) {
      fetchUserProfile();
    }
  }, [accessToken, setUser, isHydrated]);

  const isPrivateRoute = (path: string | null): boolean => {
    if (!path) return false;
    return (
      path.startsWith("/my-page") ||
      path.startsWith("/admin") ||
      path === "/book/sales/register" ||
      path === "/book/reviews/write" ||
      path.endsWith("/edit")
    );
  };

  useEffect(() => {
    if (isHydrated && !isLoading && !accessToken && isPrivateRoute(pathname)) {
      if (pathname) {
        saveReturnUrl(pathname);
      }
      router.replace(PATHS.LOGIN);
    }
  }, [isHydrated, isLoading, accessToken, pathname, router]);

  const shouldBlock =
    isPrivateRoute(pathname) && (isLoading || !isHydrated || !accessToken);

  if (shouldBlock) return <FullScreenLoader />;
  return <>{children}</>;
}
