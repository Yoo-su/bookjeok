import { User } from "@bookjeok/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { purgeUserSessionStorage } from "../utils/purge-user-storage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set(tokens),
      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      clearAuth: () => {
        // 로그인 세션이 있었을 때만 지운다. 비로그인 방문자의 최근 본 책은 남긴다
        if (get().accessToken || get().user) purgeUserSessionStorage();
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
