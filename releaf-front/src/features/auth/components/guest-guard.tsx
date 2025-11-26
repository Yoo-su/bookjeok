"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "../store";

interface GuestGuardProps {
  children: ReactNode;
}
export const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push("/home");
      return;
    }
  }, [user, router]);

  // If the user is authenticated, we will redirect, so we can return null or a loader.
  // If not, we render the children. This prevents rendering the login page for a split second before redirecting.
  if (user) {
    return null; // or a loading spinner
  }

  return children;
};
