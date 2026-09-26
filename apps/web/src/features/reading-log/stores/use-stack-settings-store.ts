import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  StackAuthor,
  StackReaderCharacter,
} from "../components/stack-view/lib/types";

/** 키 입력 범위(cm) */
export const STACK_HEIGHT_MIN = 80;
export const STACK_HEIGHT_MAX = 230;

/** 키를 입력하기 전에 보여줄 평균 키(cm) */
export const STACK_DEFAULT_HEIGHT: Record<StackReaderCharacter, number> = {
  M: 173,
  F: 161,
};

interface StackSettingsState {
  /** 사용자가 입력한 키. 입력 전에는 null이고 평균 키로 보여준다 */
  heightCm: number | null;
  /** 사용자가 고른 캐릭터. 고르기 전에는 null이고 프로필 성별을 따른다 */
  character: StackReaderCharacter | null;
  author: StackAuthor | null;
  setHeightCm: (heightCm: number) => void;
  setCharacter: (character: StackReaderCharacter) => void;
  setAuthor: (author: StackAuthor | null) => void;
}

const STORAGE_KEY = "reading-stack-settings";
/** 옛 이름(책탑) 시절 저장 키. 입력한 키를 잃지 않게 한 번 옮긴다 */
const LEGACY_STORAGE_KEY = "reading-tower-settings";

function takeOverLegacySettings() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy == null) return;
    if (localStorage.getItem(STORAGE_KEY) == null)
      localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 모드 등)은 새로 시작한다
  }
}

/**
 * 독서 키재기 설정. 키는 민감한 정보라 서버에 보내지 않고 기기에만 둔다.
 */
export const useStackSettingsStore = create<StackSettingsState>()(
  persist(
    (set) => ({
      heightCm: null,
      character: null,
      author: null,
      setHeightCm: (heightCm) =>
        set({
          heightCm: Math.min(
            STACK_HEIGHT_MAX,
            Math.max(STACK_HEIGHT_MIN, Math.round(heightCm)),
          ),
        }),
      setCharacter: (character) => set({ character }),
      setAuthor: (author) => set({ author }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        takeOverLegacySettings();
        return localStorage;
      }),
    },
  ),
);
