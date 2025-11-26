"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "../store";

interface AuthGuardProps {
  children: ReactNode;
}
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return children;
};
