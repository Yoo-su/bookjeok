"use client";

import { ChatRoom } from "@bookjeok/core";
import { isToday, isYesterday } from "date-fns";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { MessageSquareText } from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useOpenChatRoom } from "../../../hooks/use-open-chat-room";
import { getMessageImageUrls } from "../../../utils/chat-message-utils";

// 로케일별 "어제" 텍스트
const YESTERDAY_TEXT: Record<string, string> = {
  ko: "어제",
  en: "Yesterday",
};

const formatLastMessageTime = (date: string, locale: string) => {
  const messageDate = new Date(date);
  if (isToday(messageDate)) return formatDate(messageDate, locale, "time");
  if (isYesterday(messageDate))
    return YESTERDAY_TEXT[locale] ?? YESTERDAY_TEXT.en;
  return formatDate(messageDate, locale, "monthDayShort");
};

export const ChatItem = ({ room }: { room: ChatRoom }) => {
  const t = useTranslations("chat");
  const openChatRoom = useOpenChatRoom();
  const currentUser = useAuthStore((state) => state.user);
  const locale = useLocale();

  const opponent = room.participants.find(
    (p) => p.user.id !== currentUser?.id,
  )?.user;

  // 이미지만 있는 메시지는 content가 비어 있으므로 "사진"으로 표시
  const lastMessage = room.lastMessage;
  const lastMessageText = lastMessage?.content.trim();
  const lastMessagePreview =
    lastMessageText ||
    (lastMessage && getMessageImageUrls(lastMessage).length > 0
      ? t("image.last_message_preview")
      : t("no_messages"));

  const handleOpenRoom = () => {
    openChatRoom(room.id);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={handleOpenRoom}
    >
      <Avatar className="h-14 w-14" data-nosnippet>
        <AvatarImage src={getProfileImageUrl(opponent?.profileImageUrl)} />
        <AvatarFallback>{opponent?.nickname.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="grow overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="font-semibold truncate text-gray-800">
            {opponent?.nickname}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
            {t("target_book")}
          </span>
          <p className="text-sm text-gray-700 truncate font-semibold">
            {room.usedBookSale.book.title}
          </p>
        </div>
        <div className="flex justify-between items-start mt-1.5">
          <div className="flex items-center justify-between text-sm text-gray-500 w-10/12">
            <div className="flex items-center gap-1.5 truncate text-gray-500 w-10/12">
              <MessageSquareText className="h-4 w-4 shrink-0" />
              <p className="truncate" data-clarity-mask="true">
                {lastMessagePreview}
              </p>
            </div>
            {lastMessage && (
              <p className="text-xs text-gray-400 shrink-0">
                {formatLastMessageTime(lastMessage.createdAt, locale)}
              </p>
            )}
          </div>
          {(room.unreadCount ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shrink-0"
            >
              {room.unreadCount}
            </motion.div>
          )}
        </div>
      </div>
      <Avatar className="h-14 w-14 rounded-md shrink-0">
        <AvatarImage
          src={room.usedBookSale.book.image}
          alt={room.usedBookSale.book.title}
          className="object-cover rounded-md"
        />
        <AvatarFallback className="rounded-md">Book</AvatarFallback>
      </Avatar>
    </div>
  );
};
