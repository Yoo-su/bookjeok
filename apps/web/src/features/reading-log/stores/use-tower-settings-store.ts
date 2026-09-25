import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TowerCharacter } from "../components/tower-view/lib/types";

/** 키 입력 범위(cm) */
export const TOWER_HEIGHT_MIN = 80;
export const TOWER_HEIGHT_MAX = 230;

/** 키를 입력하기 전에 보여줄 평균 키(cm) */
export const TOWER_DEFAULT_HEIGHT: Record<TowerCharacter, number> = {
  M: 173,
  F: 161,
};

interface TowerSettingsState {
  /** 사용자가 입력한 키. 입력 전에는 null이고 평균 키로 보여준다 */
  heightCm: number | null;
  /** 사용자가 고른 캐릭터. 고르기 전에는 null이고 프로필 성별을 따른다 */
  character: TowerCharacter | null;
  setHeightCm: (heightCm: number) => void;
  setCharacter: (character: TowerCharacter) => void;
}

/**
 * 책탑 설정. 키는 민감한 정보라 서버에 보내지 않고 기기에만 둔다.
 */
export const useTowerSettingsStore = create<TowerSettingsState>()(
  persist(
    (set) => ({
      heightCm: null,
      character: null,
      setHeightCm: (heightCm) =>
        set({
          heightCm: Math.min(
            TOWER_HEIGHT_MAX,
            Math.max(TOWER_HEIGHT_MIN, Math.round(heightCm)),
          ),
        }),
      setCharacter: (character) => set({ character }),
    }),
    {
      name: "reading-tower-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
