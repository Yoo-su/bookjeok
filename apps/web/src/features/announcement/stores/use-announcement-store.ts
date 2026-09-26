import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AnnouncementState {
  /** 이미 본 공지 id. 기기에만 둔다 */
  seen: string[];
  markSeen: (id: string) => void;
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      seen: [],
      markSeen: (id) =>
        set((s) => (s.seen.includes(id) ? s : { seen: [...s.seen, id] })),
    }),
    {
      name: "announcements-seen",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
