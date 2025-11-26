"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import debounce from "lodash/debounce";
import { ArrowLeft, Loader2, LogOut, SendHorizontal } from "lucide-react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useInfiniteChatMessagesQuery, useMyChatRoomsQuery } from "../queries";
import { useChatStore } from "../stores/use-chat-store";
import { ChatMessage } from "../types";

const SystemMessageBubble = ({ content }: { content: string }) => (
  <div className="text-center text-xs text-gray-500 py-2">
    <span>{content}</span>
  </div>
);

const MessageBubble = ({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) => {
  if (!message.sender) {
    return <SystemMessageBubble content={message.content} />;
  }

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {!isMine && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.profileImageUrl || ""} />
          <AvatarFallback>{message.sender.nickname.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isMine
            ? "bg-emerald-700 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export const ChatRoom = () => {
  const { activeChatRoomId, closeChatRoom, typingUsers, isRoomInactive } =
    useChatStore();
  const { socket } = useSocketContext();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<{ scrollHeight: number } | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  const { data: roomsData } = useMyChatRoomsQuery();
  const {
    data: messagesData,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading: isMessagesLoading,
  } = useInfiniteChatMessagesQuery(activeChatRoomId!);

  const room = useMemo(
    () => roomsData?.find((r) => r.id === activeChatRoomId),
    [roomsData, activeChatRoomId]
  );

  const messages = useMemo(() => {
    if (!messagesData) return [];
    return messagesData.pages
      .flatMap((page) => page.messages)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [messagesData]);

  const typingNickname = activeChatRoomId ? typingUsers[activeChatRoomId] : "";
  const isInactive = isRoomInactive[room?.id ?? -1] || false;

  const emitStopTyping = useMemo(
    () => () => {
      if (socket && activeChatRoomId) {
        socket.emit("stopTyping", { roomId: activeChatRoomId });
      }
    },
    [socket, activeChatRoomId]
  );

  const debouncedStopTyping = useMemo(
    () => debounce(emitStopTyping, 1500),
    [emitStopTyping]
  );

  useEffect(() => {
    return () => {
      debouncedStopTyping.cancel();
    };
  }, [debouncedStopTyping]);

  useLayoutEffect(() => {
    if (scrollRef.current && messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight -
        scrollRef.current.scrollHeight;
      scrollRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages]);

  if (isMessagesLoading || !room) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const opponent = room.participants.find(
    (p) => p.user.id !== currentUser?.id
  )?.user;

  const handleScroll = () => {
    if (
      messageContainerRef.current?.scrollTop === 0 &&
      hasPreviousPage &&
      !isFetchingPreviousPage
    ) {
      scrollRef.current = {
        scrollHeight: messageContainerRef.current.scrollHeight,
      };
      fetchPreviousPage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && activeChatRoomId) {
      socket.emit("startTyping", { roomId: activeChatRoomId });
    }
    debouncedStopTyping();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !activeChatRoomId || !newMessage.trim()) return;

    socket.emit(
      "sendMessage",
      { roomId: activeChatRoomId, content: newMessage },
      (response: { status: string; error?: string }) => {
        if (response.status !== "ok") {
          console.error("Message failed to send:", response.error);
          alert(`메시지 전송에 실패했습니다: ${response.error}`);
        }
      }
    );
    setNewMessage("");
    debouncedStopTyping.cancel();
    emitStopTyping();
  };

  const handleLeaveRoom = () => {
    if (
      !socket ||
      !activeChatRoomId ||
      !window.confirm("정말로 이 채팅방을 나가시겠습니까?")
    ) {
      return;
    }

    socket.emit(
      "leaveRoom",
      { roomId: activeChatRoomId },
      (response: { status: string; error?: string }) => {
        if (response.status === "ok") {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
          });
          closeChatRoom();
        } else {
          alert(`채팅방을 나가는 데 실패했습니다: ${response.error}`);
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={closeChatRoom}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={room.usedBookSale.book.image}
              alt={room.usedBookSale.book.title}
              fill
              className="rounded-md object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{opponent?.nickname}</p>
            <div className="h-5">
              <AnimatePresence>
                {typingNickname && (
                  <motion.p
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-emerald-600 truncate"
                  >
                    {typingNickname}님이 입력 중...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:bg-red-50"
          onClick={handleLeaveRoom}
        >
          <LogOut size={20} />
        </Button>
      </div>

      <div
        className="flex-grow overflow-y-auto p-4 space-y-4"
        ref={messageContainerRef}
        onScroll={handleScroll}
      >
        {isFetchingPreviousPage && (
          <div className="text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.sender?.id === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white flex-shrink-0">
        {isInactive ? (
          <div className="text-center text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
            대화가 종료된 채팅방입니다.
          </div>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={handleSendMessage}
          >
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="메시지를 입력하세요..."
              autoComplete="off"
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <SendHorizontal size={20} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
