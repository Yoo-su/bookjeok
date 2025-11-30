"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store";
import { User } from "@/features/auth/types";
import { PATHS } from "@/shared/constants/paths";

const CallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userString = searchParams.get("user");

    if (accessToken && refreshToken && userString) {
      try {
        const user: User = JSON.parse(userString);
        setTokens({ accessToken, refreshToken });
        setUser(user);
        router.replace(PATHS.HOME);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.replace(PATHS.LOGIN);
      }
    } else {
      router.replace(PATHS.LOGIN);
    }
  }, [router, searchParams, setTokens, setUser]);

  return null;
};

export default CallbackPage;
