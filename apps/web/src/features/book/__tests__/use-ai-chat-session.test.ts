import { User } from "@bookjeok/core";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { CHAT_STORAGE_KEY } from "../constants/ai-chat";
import { useAiChat } from "../hooks/use-ai-chat";

// 실제 next-intl처럼 같은 t를 돌려준다. 매 렌더 새 함수면 인사말 메모가 깨져 렌더가 멈추지 않는다
vi.mock("next-intl", () => {
  const t = (key: string) => key;
  return { useTranslations: () => t };
});

const userKey = `${CHAT_STORAGE_KEY}_user_1`;
const guestKey = `${CHAT_STORAGE_KEY}_guest`;
const secret = { id: "m1", role: "user", content: "비밀 고민 상담" };

describe("AI 대화 기록의 계정 격리", () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth();
    sessionStorage.clear();
  });

  it("로그아웃하면 이전 사용자의 대화를 게스트 키로 옮겨 적지 않는다", () => {
    useAuthStore.getState().setAuth({
      user: { id: 1, nickname: "A" } as User,
      accessToken: "a",
      refreshToken: "r",
    });
    sessionStorage.setItem(userKey, JSON.stringify([secret]));

    const { result } = renderHook(() => useAiChat());
    expect(result.current.messages).toEqual([secret]);

    // 곧바로 인사말로 덮어써지더라도, 그 사이 한 번이라도 적히면 안 된다
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    act(() => useAuthStore.getState().clearAuth());

    const guestWrites = setItem.mock.calls.filter(([key]) => key === guestKey);
    expect(guestWrites.map(([, value]) => value).join()).not.toContain(
      secret.content,
    );
    expect(sessionStorage.getItem(userKey)).toBeNull();
    expect(result.current.messages).not.toContainEqual(secret);
    setItem.mockRestore();
  });
});
