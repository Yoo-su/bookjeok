import { create } from "zustand";

interface ChatState {
  isChatOpen: boolean;
  activeChatRoomId: number | null;
  typingUsers: { [roomId: number]: string };
  isRoomInactive: { [roomId: number]: boolean };
  hasJoinedRooms: boolean;
  typingTimeouts: { [roomId: number]: NodeJS.Timeout };
  /** 방별 상대방이 읽은 마지막 메시지 ID (내 메시지의 읽음 표시용) */
  opponentLastReadMessageId: { [roomId: number]: number };

  toggleChat: () => void;
  closeChat: () => void;
  openChatRoom: (roomId: number) => void;
  closeChatRoom: () => void;
  setTyping: (roomId: number, nickname: string) => void;
  setRoomInactive: (roomId: number, isInactive: boolean) => void;
  setHasJoinedRooms: (hasJoined: boolean) => void;
  setOpponentLastReadMessageId: (roomId: number, messageId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isChatOpen: false,
  activeChatRoomId: null,
  typingUsers: {},
  isRoomInactive: {},
  hasJoinedRooms: false,
  typingTimeouts: {},
  opponentLastReadMessageId: {},

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  closeChat: () => set({ isChatOpen: false }),

  /**
   * 채팅방을 엽니다. UI 상태만 변경합니다.
   * 읽음 처리가 함께 필요하면 `useOpenChatRoom`을 사용합니다.
   */
  openChatRoom: (roomId) => {
    set({ activeChatRoomId: roomId, isChatOpen: true });
  },

  closeChatRoom: () => {
    set({ activeChatRoomId: null });
  },

  setTyping: (roomId, nickname) => {
    const existingTimeout = get().typingTimeouts[roomId];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (nickname) {
      // 타이핑 시작
      const timeoutId = setTimeout(() => {
        set((state) => {
          const newTypingUsers = { ...state.typingUsers };
          delete newTypingUsers[roomId];
          return { typingUsers: newTypingUsers };
        });
      }, 4000); // 4초 후 자동 만료

      set((state) => ({
        typingUsers: { ...state.typingUsers, [roomId]: nickname },
        typingTimeouts: { ...state.typingTimeouts, [roomId]: timeoutId },
      }));
    } else {
      // 타이핑 종료
      set((state) => {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[roomId];
        const newTypingTimeouts = { ...state.typingTimeouts };
        delete newTypingTimeouts[roomId];
        return {
          typingUsers: newTypingUsers,
          typingTimeouts: newTypingTimeouts,
        };
      });
    }
  },

  setRoomInactive: (roomId, isInactive) => {
    set((state) => ({
      isRoomInactive: {
        ...state.isRoomInactive,
        [roomId]: isInactive,
      },
    }));
  },

  setHasJoinedRooms: (hasJoined: boolean) => {
    set({ hasJoinedRooms: hasJoined });
  },

  /**
   * 상대방의 읽음 지점을 갱신합니다.
   * 이벤트 순서가 뒤바뀌어도 되돌아가지 않도록 더 큰 값만 반영합니다.
   */
  setOpponentLastReadMessageId: (roomId, messageId) => {
    const current = get().opponentLastReadMessageId[roomId] ?? 0;
    if (messageId <= current) return;

    set((state) => ({
      opponentLastReadMessageId: {
        ...state.opponentLastReadMessageId,
        [roomId]: messageId,
      },
    }));
  },
}));
