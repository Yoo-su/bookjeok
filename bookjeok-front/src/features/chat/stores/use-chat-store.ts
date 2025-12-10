import { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { markMessagesAsRead } from "../apis";
import { ChatRoom } from "../types";

interface ChatState {
  isChatOpen: boolean;
  activeChatRoomId: number | null;
  typingUsers: { [roomId: number]: string };
  isRoomInactive: { [roomId: number]: boolean };
  hasJoinedRooms: boolean;
  typingTimeouts: { [roomId: number]: NodeJS.Timeout };

  toggleChat: () => void;
  openChatRoom: (roomId: number, queryClient: QueryClient) => void;
  closeChatRoom: () => void;
  setTyping: (roomId: number, nickname: string) => void;
  setRoomInactive: (roomId: number, isInactive: boolean) => void;
  markRoomAsRead: (roomId: number, queryClient: QueryClient) => void;
  setHasJoinedRooms: (hasJoined: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isChatOpen: false,
  activeChatRoomId: null,
  typingUsers: {},
  isRoomInactive: {},
  hasJoinedRooms: false,
  typingTimeouts: {},

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  openChatRoom: (roomId, queryClient) => {
    get().markRoomAsRead(roomId, queryClient);
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
      // isTyping: true
      const timeoutId = setTimeout(() => {
        set((state) => {
          const newTypingUsers = { ...state.typingUsers };
          delete newTypingUsers[roomId];
          return { typingUsers: newTypingUsers };
        });
      }, 4000); // 4초 뒤 자동 만료

      set((state) => ({
        typingUsers: { ...state.typingUsers, [roomId]: nickname },
        typingTimeouts: { ...state.typingTimeouts, [roomId]: timeoutId },
      }));
    } else {
      // isTyping: false
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

  markRoomAsRead: async (roomId, queryClient) => {
    queryClient.setQueryData<ChatRoom[]>(
      QUERY_KEYS.chatKeys.rooms.queryKey,
      (oldRooms) => {
        if (!oldRooms) return [];
        return oldRooms.map((room) =>
          room.id === roomId ? { ...room, unreadCount: 0 } : room
        );
      }
    );

    try {
      await markMessagesAsRead(roomId);
    } catch (error) {
      console.error("Failed to mark messages as read on server:", error);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
      });
    }
  },

  setHasJoinedRooms: (hasJoined: boolean) => {
    set({ hasJoinedRooms: hasJoined });
  },
}));
