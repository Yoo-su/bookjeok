"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store";
import { ChatToggleButton } from "@/features/chat/components/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useMyChatRoomsQuery } from "@/features/chat/queries";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

import { useSocketContext } from "./socket-provider";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocketContext();
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const { hasJoinedRooms, setHasJoinedRooms } = useChatStore();
  const { data: rooms, isSuccess: isRoomsLoaded } = useMyChatRoomsQuery({
    enabled: !!user,
  });

  // Effect 1: Manages event listener lifecycle.
  // This is stable and only runs on auth/connection changes, fixing the churn.
  useEffect(() => {
    if (user && isConnected) {
      registerChatEventListeners();
      return () => {
        unregisterChatEventListeners();
      };
    }
  }, [
    user,
    isConnected,
    registerChatEventListeners,
    unregisterChatEventListeners,
  ]);

  // Effect 2: Handles the one-time action of joining rooms.
  useEffect(() => {
    if (isConnected && socket && isRoomsLoaded && rooms && !hasJoinedRooms) {
      const roomIds = rooms.map((room) => room.id);
      if (roomIds.length > 0) {
        socket.emit(
          "joinRooms",
          roomIds,
          (response: { status: string; joinedRooms: number[] }) => {
            if (response.status === "ok") {
              console.log(
                "Successfully joined rooms from provider:",
                response.joinedRooms
              );
              setHasJoinedRooms(true);
            } else {
              console.error("Failed to join rooms from provider");
            }
          }
        );
      } else {
        // No rooms to join, but mark as joined to prevent re-attempts this session.
        setHasJoinedRooms(true);
      }
    }
  }, [
    isConnected,
    socket,
    isRoomsLoaded,
    rooms,
    hasJoinedRooms,
    setHasJoinedRooms,
  ]);

  // Effect 3: Resets the joined status on logout or disconnection.
  useEffect(() => {
    if (!user || !isConnected) {
      setHasJoinedRooms(false);
    }
  }, [user, isConnected, setHasJoinedRooms]);

  return (
    <>
      {children}
      {user && (
        <>
          <ChatToggleButton />
          <ChatWidget />
        </>
      )}
    </>
  );
};
