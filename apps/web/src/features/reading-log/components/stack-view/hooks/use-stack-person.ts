"use client";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import {
  STACK_DEFAULT_HEIGHT,
  useStackSettingsStore,
} from "../../../stores/use-stack-settings-store";

/** 쌓은 책 옆에 세울 내 캐릭터와 키. 입력 전에는 프로필 성별과 평균 키를 쓴다 */
export function useStackPerson() {
  const user = useAuthStore((s) => s.user);
  const heightSetting = useStackSettingsStore((s) => s.heightCm);
  const characterSetting = useStackSettingsStore((s) => s.character);
  const setHeightCm = useStackSettingsStore((s) => s.setHeightCm);
  const setCharacter = useStackSettingsStore((s) => s.setCharacter);

  // 캐릭터를 고르기 전에는 프로필 성별(소셜 로그인에서 'M' | 'F')을 따른다
  const character = characterSetting ?? (user?.gender === "F" ? "F" : "M");
  const heightCm = heightSetting ?? STACK_DEFAULT_HEIGHT[character];
  return {
    character,
    heightCm,
    isDefaultHeight: heightSetting == null,
    setHeightCm,
    setCharacter,
  };
}
