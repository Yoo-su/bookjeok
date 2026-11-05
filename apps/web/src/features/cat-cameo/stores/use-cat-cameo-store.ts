import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CameoScene } from "../constants";
import { type CameoLedger, dayKey } from "../lib/schedule";

interface CatCameoState extends CameoLedger {
  markShown: (scene: CameoScene, now: number) => void;
}

/** 오늘 나온 횟수와 마지막 장면. 기기에만 둔다 */
export const useCatCameoStore = create<CatCameoState>()(
  persist(
    (set) => ({
      day: "",
      shownToday: 0,
      lastScene: null,
      markShown: (scene, now) =>
        set((s) => {
          const day = dayKey(now);
          return {
            day,
            shownToday: (s.day === day ? s.shownToday : 0) + 1,
            lastScene: scene,
          };
        }),
    }),
    {
      name: "cat-cameo",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        day: s.day,
        shownToday: s.shownToday,
        lastScene: s.lastScene,
      }),
    },
  ),
);
