import { ChatMessage, ChatMessageType } from "@bookjeok/core";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { memo, RefObject, useMemo, useState } from "react";

import {
  Check,
  Loader2,
  RotateCcw,
  X,
} from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { ImageLightbox } from "@/shared/components/ui/image-lightbox";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import {
  getMessageImageUrls,
  hasMessageText,
  splitTextWithLinks,
} from "../../../utils/chat-message-utils";
import { TradeMessageCard } from "../../trade/trade-message-card";

/** 내 메시지의 전송/읽음 상태 */
type OwnMessageStatus = "sending" | "failed" | "sent" | "read";

/** 시스템 메시지 버블 */
const SystemMessageBubble = ({ content }: { content: string }) => (
  <div className="text-center text-xs text-gray-500 py-2">
    <span>{content}</span>
  </div>
);

/** 메시지 버블 내 첨부 이미지 그리드 (클릭 시 라이트박스) */
const MessageImages = ({
  imageUrls,
  isSending,
}: {
  imageUrls: string[];
  isSending: boolean;
}) => {
  const t = useTranslations("common");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className={`grid w-full gap-1 ${imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {imageUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setLightboxIndex(index)}
            disabled={isSending}
            aria-label={t("aria.preview_image", { index: index + 1 })}
            className="relative aspect-square overflow-hidden rounded-lg bg-stone-100 transition-opacity hover:opacity-90 disabled:cursor-default"
          >
            <Image
              src={url}
              alt={t("aria.preview_image", { index: index + 1 })}
              fill
              sizes="208px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={imageUrls}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      />
    </>
  );
};

/**
 * 메시지 본문. 줄바꿈을 유지하고 URL은 링크로 변환합니다.
 * HTML 주입 없이 텍스트 조각 단위로 렌더링합니다.
 */
const MessageText = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  const segments = useMemo(() => splitTextWithLinks(content), [content]);

  return (
    <p
      className={`text-sm whitespace-pre-wrap break-words ${className ?? ""}`}
      data-clarity-mask="true"
    >
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="break-all underline underline-offset-2"
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </p>
  );
};

/** 전송 중 표시(점 세 개) */
const SendingIndicator = () => (
  <motion.div
    className="flex gap-0.5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1 h-1 bg-gray-400 rounded-full"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </motion.div>
);

/**
 * 내 메시지 옆의 상태 표시.
 * 실패한 메시지는 이 자리에서 재전송하거나 삭제합니다.
 */
const OwnMessageStatusColumn = ({
  status,
  onRetry,
  onDiscard,
}: {
  status: OwnMessageStatus;
  onRetry?: () => void;
  onDiscard?: () => void;
}) => {
  const t = useTranslations("chat");

  if (status === "failed") {
    return (
      <div className="flex items-end gap-0.5 mb-1">
        <button
          type="button"
          onClick={onDiscard}
          aria-label={t("aria.discard_message")}
          title={t("aria.discard_message")}
          className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRetry}
          aria-label={t("aria.retry_message")}
          title={t("send_failed")}
          className="rounded-full p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end mb-1">
      {status === "sending" ? (
        <SendingIndicator />
      ) : status === "read" ? (
        <span className="text-[10px] font-medium leading-none text-emerald-600">
          {t("read")}
        </span>
      ) : (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check className="w-3 h-3 text-emerald-600" />
        </motion.div>
      )}
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  currentUserId?: number;
  /** 내 메시지 옆에 표시할 상태 (읽음 표시는 마지막 메시지에만 전달) */
  ownStatus?: OwnMessageStatus;
  onRetry?: (message: ChatMessage) => void;
  onDiscard?: (message: ChatMessage) => void;
}

/** 메시지 버블 */
const MessageBubbleComponent = ({
  message,
  isMine,
  currentUserId,
  ownStatus,
  onRetry,
  onDiscard,
}: MessageBubbleProps) => {
  // 거래 관련 시스템 카드 메시지
  if (
    message.type === ChatMessageType.TRADE_STATUS ||
    message.type === ChatMessageType.TRADE_ACTION
  ) {
    return <TradeMessageCard message={message} currentUserId={currentUserId} />;
  }

  // 일반 시스템 메시지
  if (!message.sender || message.type === ChatMessageType.SYSTEM) {
    return <SystemMessageBubble content={message.content} />;
  }

  const isFailed = ownStatus === "failed";
  const isSending = ownStatus === "sending";
  const imageUrls = getMessageImageUrls(message);
  const hasImages = imageUrls.length > 0;
  const hasText = hasMessageText(message);

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {!isMine && (
        <Avatar className="h-8 w-8" data-nosnippet>
          <AvatarImage
            src={getProfileImageUrl(message.sender.profileImageUrl)}
          />
          <AvatarFallback>{message.sender.nickname.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      {/* 내 메시지일 때 전송/읽음 상태를 버블 왼쪽에 표시 */}
      {isMine && ownStatus && (
        <OwnMessageStatusColumn
          status={ownStatus}
          onRetry={onRetry ? () => onRetry(message) : undefined}
          onDiscard={onDiscard ? () => onDiscard(message) : undefined}
        />
      )}
      <div
        className={`max-w-[70%] rounded-2xl ${hasImages ? "w-52 p-1.5" : "px-4 py-2"} ${
          isMine
            ? "bg-emerald-700 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        } ${isSending ? "opacity-70" : ""} ${
          isFailed ? "opacity-60 ring-1 ring-red-300" : ""
        }`}
      >
        {hasImages && (
          <MessageImages imageUrls={imageUrls} isSending={isSending} />
        )}
        {hasText && (
          <MessageText
            content={message.content}
            className={hasImages ? "px-2.5 pb-1 pt-2" : ""}
          />
        )}
      </div>
    </div>
  );
};

/**
 * 메시지 증가 시 목록 전체가 리렌더되므로 말풍선 단위로 메모이제이션합니다.
 * 캐시에서 변경된 메시지만 새 참조를 가지므로 참조 비교로 충분합니다.
 */
const MessageBubble = memo(MessageBubbleComponent);

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  /** 상대방이 읽은 마지막 메시지 ID */
  opponentLastReadMessageId?: number;
  isFetchingPreviousPage: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messageContainerRef: RefObject<HTMLDivElement | null>;
  contentRef?: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onRetryMessage?: (message: ChatMessage) => void;
  onDiscardMessage?: (message: ChatMessage) => void;
}

/**
 * 메시지 목록을 표시하는 컴포넌트입니다.
 * - `MessageBubble` 컴포넌트를 사용하여 개별 메시지를 렌더링합니다.
 * - 무한 스크롤 기능을 지원하며, 스크롤이 상단에 도달하면 이전 메시지를 불러옵니다.
 * - 로딩 시 `Loader2` 스피너를 표시합니다.
 */
export const MessageList = ({
  messages,
  currentUserId,
  opponentLastReadMessageId = 0,
  isFetchingPreviousPage,
  messagesEndRef,
  messageContainerRef,
  contentRef,
  onScroll,
  onRetryMessage,
  onDiscardMessage,
}: MessageListProps) => {
  // 읽음 표시는 내 마지막 메시지에만 적용
  // (전체에 적용하면 읽음 이벤트마다 내 말풍선 전부가 리렌더됨)
  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.sender?.id === currentUserId && message.id > 0) {
        return message.id;
      }
    }
    return 0;
  }, [messages, currentUserId]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="grow overflow-y-auto p-4 custom-scrollbar stable-scroll"
      ref={messageContainerRef}
      onScroll={onScroll}
    >
      <div ref={contentRef} className="space-y-4">
        {isFetchingPreviousPage && (
          <div className="text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.sender?.id === currentUserId;

          let ownStatus: OwnMessageStatus | undefined;
          if (isMine) {
            if (message.id < 0) {
              // 아직 서버에 확정되지 않은 낙관적 메시지
              ownStatus = message.sendState === "failed" ? "failed" : "sending";
            } else if (message.id === lastOwnMessageId) {
              ownStatus =
                message.id <= opponentLastReadMessageId ? "read" : "sent";
            } else {
              ownStatus = "sent";
            }
          }

          return (
            <MessageBubble
              // 상관 ID가 있으면 낙관적 → 확정 교체 후에도 키를 유지해
              // 말풍선과 첨부 이미지의 재마운트 방지
              key={
                message.clientMessageId
                  ? `cid:${message.clientMessageId}`
                  : message.id
              }
              message={message}
              isMine={isMine}
              currentUserId={currentUserId}
              ownStatus={ownStatus}
              onRetry={onRetryMessage}
              onDiscard={onDiscardMessage}
            />
          );
        })}
        <div
          ref={messagesEndRef}
          className="h-2 shrink-0 pointer-events-none"
        />
      </div>
    </div>
  );
};
