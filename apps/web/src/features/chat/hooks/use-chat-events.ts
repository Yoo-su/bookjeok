"use client";

import {
  chatKeys,
  ChatMessage,
  ChatMessageType,
  ChatRoom,
  MessagesReadEvent,
  TypingEvent,
} from "@bookjeok/core";
import { invalidateTradeCaches } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useChatStore } from "../stores/use-chat-store";
import {
  prependMessageToCache,
  replaceOptimisticMessage,
  updateRoomLastMessage,
} from "../utils/chat-cache-utils";

export const useChatEvents = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const setTyping = useChatStore((state) => state.setTyping);
  const setRoomInactive = useChatStore((state) => state.setRoomInactive);
  const setOpponentLastReadMessageId = useChatStore(
    (state) => state.setOpponentLastReadMessageId,
  );

  const handleNewChatRoom = useCallback(
    (newRoom: ChatRoom) => {
      queryClient.setQueryData<ChatRoom[]>(
        chatKeys.rooms.queryKey,
        (oldData) => {
          if (oldData) {
            // 이미 존재하는 방이면 추가하지 않음
            if (oldData.some((room) => room.id === newRoom.id)) {
              return oldData;
            }
            return [newRoom, ...oldData];
          }
          return [newRoom];
        },
      );
    },
    [queryClient],
  );

  const handleNewMessage = useCallback(
    (newMessage: ChatMessage) => {
      const roomId = newMessage.chatRoom.id;
      const currentUserId = useAuthStore.getState().user?.id;

      // 채팅 상태를 한 번만 조회하여 재사용
      const { isChatOpen, activeChatRoomId } = useChatStore.getState();
      const isChatVisible = isChatOpen && activeChatRoomId === roomId;

      // 읽음 처리는 ChatRoom이 보이는 방의 마지막 메시지 기준으로 한 번만 전송
      // (여기서 메시지마다 emit하면 중복 요청 누적)

      // 내가 보낸 메시지인 경우, 낙관적 메시지를 실제 메시지로 교체
      const isMyMessage = newMessage.sender?.id === currentUserId;

      if (isMyMessage) {
        replaceOptimisticMessage(queryClient, roomId, newMessage);
      } else {
        prependMessageToCache(queryClient, roomId, newMessage);
      }

      // 채팅방 목록 업데이트: 마지막 메시지 & 안읽음 카운트 갱신
      updateRoomLastMessage(
        queryClient,
        roomId,
        newMessage,
        Boolean(isChatVisible || isMyMessage),
      );

      // 로컬 거래 변경과 동일한 정책으로 완료 기록·후기 자격까지 갱신한다.
      if (
        newMessage.type === ChatMessageType.TRADE_STATUS ||
        newMessage.type === ChatMessageType.TRADE_ACTION
      ) {
        void invalidateTradeCaches(queryClient);
      }
    },
    [queryClient],
  );

  const handleUserLeft = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(queryClient, roomId, message);
      setRoomInactive(roomId, true);
    },
    [queryClient, setRoomInactive],
  );

  const handleUserRejoined = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(queryClient, roomId, message);
      setRoomInactive(roomId, false);
      queryClient.invalidateQueries({
        queryKey: chatKeys.rooms.queryKey,
      });
    },
    [queryClient, setRoomInactive],
  );

  const handleTyping = useCallback(
    ({ roomId, nickname, isTyping }: TypingEvent) => {
      // 서버가 지정한 방에만 반영 (열린 방에 일괄 적용 시 다른 방의 입력이 오표시됨)
      if (typeof roomId !== "number") return;
      setTyping(roomId, isTyping ? nickname : "");
    },
    [setTyping],
  );

  const handleMessagesRead = useCallback(
    ({ roomId, userId, lastReadMessageId }: MessagesReadEvent) => {
      // 내 읽음 기록은 내 메시지의 읽음 표시와 무관
      if (userId === useAuthStore.getState().user?.id) return;
      setOpponentLastReadMessageId(roomId, lastReadMessageId);
    },
    [setOpponentLastReadMessageId],
  );

  const registerChatEventListeners = useCallback(() => {
    if (!socket) return;
    socket.on("newChatRoom", handleNewChatRoom);
    socket.on("newMessage", handleNewMessage);
    socket.on("userLeft", handleUserLeft);
    socket.on("userRejoined", handleUserRejoined);
    socket.on("typing", handleTyping);
    socket.on("messagesRead", handleMessagesRead);
  }, [
    socket,
    handleNewChatRoom,
    handleNewMessage,
    handleUserLeft,
    handleUserRejoined,
    handleTyping,
    handleMessagesRead,
  ]);

  const unregisterChatEventListeners = useCallback(() => {
    if (!socket) return;
    socket.off("newChatRoom", handleNewChatRoom);
    socket.off("newMessage", handleNewMessage);
    socket.off("userLeft", handleUserLeft);
    socket.off("userRejoined", handleUserRejoined);
    socket.off("typing", handleTyping);
    socket.off("messagesRead", handleMessagesRead);
  }, [
    socket,
    handleNewChatRoom,
    handleNewMessage,
    handleUserLeft,
    handleUserRejoined,
    handleTyping,
    handleMessagesRead,
  ]);

  return { registerChatEventListeners, unregisterChatEventListeners };
};
