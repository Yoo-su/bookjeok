import type { ReadingStackBook } from "@bookjeok/core";
import { create } from "zustand";

import type { StackMilestone } from "../components/stack-view/lib/collection";
import type { StackReaderCharacter } from "../components/stack-view/lib/types";

export interface StackMilestoneScene {
  year: number;
  /** 방금 기록한 책을 포함한 그해 쌓은 책(완독일 오름차순) */
  books: ReadingStackBook[];
  logId: string;
  milestone: StackMilestone;
  userMm: number;
  character: StackReaderCharacter;
}

interface StackMilestoneState {
  /** 닫은 뒤에도 남겨 닫히는 움직임 동안 내용이 사라지지 않게 한다 */
  scene: StackMilestoneScene | null;
  open: boolean;
  show: (scene: StackMilestoneScene) => void;
  close: () => void;
}

/** 기록 직후 장면. 기록은 도서 상세·달력 어디서나 하므로 루트의 호스트가 띄운다 */
export const useStackMilestoneStore = create<StackMilestoneState>()((set) => ({
  scene: null,
  open: false,
  show: (scene) => set({ scene, open: true }),
  close: () => set({ open: false }),
}));
