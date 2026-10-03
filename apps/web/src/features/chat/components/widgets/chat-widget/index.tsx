"use client";

import { useTranslations } from "next-intl";

import { DockPanel } from "@/shared/components/ui/dock-panel";

import { useChatStore } from "../../../stores/use-chat-store";
import { ChatList } from "../../list/chat-list";
import { ChatRoom } from "../../room/chat-room";

/**
 * 채팅 패널. 하단 dock의 채팅 버튼으로 연다
 * - 데스크톱은 dock 위 카드, 모바일은 바텀시트(`DockPanel`)
 * - 한 번 열면 닫아도 마운트 유지. 말풍선·첨부 이미지 DOM을 지우면 웹킷(특히 iOS)이
 *   디코딩 데이터를 빨리 버려 다시 열 때 전체 재디코딩으로 버벅임
 * - 페이지를 보며 대화할 수 있게 바깥을 눌러도 닫지 않음
 */
export const ChatWidget = () => {
  const t = useTranslations("chat");
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const activeChatRoomId = useChatStore((state) => state.activeChatRoomId);
  const closeChat = useChatStore((state) => state.closeChat);

  return (
    <DockPanel
      open={isChatOpen}
      onClose={closeChat}
      label={t("title")}
      desktopClassName="h-[37.5rem] w-[min(24rem,calc(100vw-2rem))]"
    >
      {/* Clarity 세션 녹화에서 채팅 내용 마스킹 */}
      <div className="flex min-h-0 flex-1 flex-col" data-clarity-mask="true">
        {activeChatRoomId ? (
          <ChatRoom roomId={activeChatRoomId} />
        ) : (
          <ChatList />
        )}
      </div>
    </DockPanel>
  );
};
