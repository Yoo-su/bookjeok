"use client";

import { ReactNode, useEffect, useState } from "react";

import { getUserProfile } from "@/features/auth/apis";
import { useAuthStore } from "@/features/auth/store";
import { FullScreenLoader } from "@/shared/components/ui/full-screen-loader";

interface UesrProviderProps {
  children: ReactNode;
}
export default function UserProvider({ children }: UesrProviderProps) {
  const { setUser, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  if (isLoading || !isHydrated) return <FullScreenLoader />;
  return <>{children}</>;
}
