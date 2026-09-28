import { FeedbackType } from "@bookjeok/core";
import { create } from "zustand";

export interface FeedbackPreset {
  type?: FeedbackType;
  bookTitle?: string;
}

interface FeedbackDialogState {
  isOpen: boolean;
  preset: FeedbackPreset | null;
  /** 열 때마다 올려 폼을 새로 그린다 */
  session: number;
  open: (preset?: FeedbackPreset) => void;
  close: () => void;
}

export const useFeedbackDialogStore = create<FeedbackDialogState>()((set) => ({
  isOpen: false,
  preset: null,
  session: 0,
  open: (preset) =>
    set((s) => ({
      isOpen: true,
      preset: preset ?? null,
      session: s.session + 1,
    })),
  close: () => set({ isOpen: false }),
}));
