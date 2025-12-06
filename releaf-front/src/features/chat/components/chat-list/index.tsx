"use client";

import { MessageSquareX } from "lucide-react";

import { useMyChatRoomsQuery } from "../../queries";
import { ChatItem } from "../chat-item";
import { ChatListSkeleton } from "./skeleton";

/**
 * 채팅방 목록을 보여주는 컴포넌트입니다.
 */
export const ChatList = () => {
  const { data: rooms, isLoading } = useMyChatRoomsQuery();

  if (isLoading) {
    return <ChatListSkeleton />;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MessageSquareX size={48} />
        <p className="mt-4">아직 대화가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">채팅 목록</h3>
      </div>
      <div className="grow overflow-y-auto">
        {rooms.map((room) => (
          <ChatItem key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
};
