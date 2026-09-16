import { chatKeys, ChatRoom, OrderStatus } from "@bookjeok/core";
import { useActiveOrderByRoomQuery } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/features/confirm";
import { BookIcon } from "@/shared/components/icons";
import { ArrowLeft, LogOut } from "@/shared/components/icons/iconsax";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSocketContext } from "@/shared/providers/socket-provider";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useChatStore } from "../../../stores/use-chat-store";

interface ChatRoomHeaderProps {
  room: ChatRoom;
  opponentNickname?: string;
  opponentProfileImageUrl?: string | null;
  opponentHandle?: string;
  typingNickname?: string;
}

/**
 * 채팅방 헤더 컴포넌트입니다.
 * - 뒤로가기 버튼, 상대방 프로필 및 닉네임, 책 정보 이미지를 표시합니다.
 * - 평소에는 도서 정보(제목, 가격)를 표시하고, 상대방이 입력 중일 때는 '입력 중...' 인디케이터로 전환합니다.
 * - 채팅방 나가기 기능을 제공합니다.
 */
export const ChatRoomHeader = ({
  room,
  opponentNickname,
  opponentProfileImageUrl,
  opponentHandle,
  typingNickname,
}: ChatRoomHeaderProps) => {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const closeChatRoom = useChatStore((state) => state.closeChatRoom);
  const activeChatRoomId = useChatStore((state) => state.activeChatRoomId);
  // 위젯은 닫혀도 언마운트되지 않으므로, 5초 주기 주문 폴링을 막기 위해
  // 노출 여부를 조회 조건에 포함
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  const isPaymentFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  const { data: order } = useActiveOrderByRoomQuery(
    activeChatRoomId ?? undefined,
    {
      enabled:
        Boolean(activeChatRoomId) && isPaymentFeatureEnabled && isChatOpen,
    },
  );

  const isInTrade = Boolean(
    isPaymentFeatureEnabled &&
      order &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CONFIRMED,
  );

  const confirm = useConfirm();

  const handleLeaveRoom = useCallback(async () => {
    if (!socket || !activeChatRoomId) {
      return;
    }

    if (isInTrade) {
      toast.error(t("cannot_leave_during_trade"));
      return;
    }

    const isConfirmed = await confirm({
      title: t("leave_dialog.title"),
      description: t("leave_dialog.description"),
      confirmText: t("leave_dialog.confirm"),
      variant: "destructive",
    });

    if (!isConfirmed) return;

    socket.emit(
      "leaveRoom",
      { roomId: activeChatRoomId },
      (response: { status: string; error?: string }) => {
        if (response.status === "ok") {
          queryClient.invalidateQueries({
            queryKey: chatKeys.rooms.queryKey,
          });
          closeChatRoom();
        } else {
          toast.error(t("toast.leave_error", { error: response.error || "" }));
        }
      },
    );
  }, [
    socket,
    activeChatRoomId,
    isInTrade,
    confirm,
    queryClient,
    closeChatRoom,
    t,
  ]);

  const bookImage =
    room.usedBookSale?.imageUrls?.[0] || room.usedBookSale?.book?.image;
  const bookTitle = room.usedBookSale?.title || room.usedBookSale?.book?.title;
  const bookPrice = room.usedBookSale?.price;

  // 헤더 배경이 불투명하므로 backdrop-blur는 시각적 효과가 없고,
  // 사파리에서는 위젯 열림 애니메이션 내내 백드롭 레이어를 재래스터화하므로 미사용
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-stone-200 dark:border-stone-800 shrink-0 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 shrink-0"
          onClick={closeChatRoom}
          aria-label={t("aria.close_room")}
        >
          <ArrowLeft size={18} />
        </Button>

        {/* 책 표지 썸네일 */}
        <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-2xs">
          {bookImage ? (
            <Image
              src={bookImage}
              alt={bookTitle || t("book_cover_alt")}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <BookIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* 대화 상대 정보 + 서브라인(도서 정보 or 입력중 인디케이터) */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* 1행: 상대방 프로필 & 닉네임 (클릭 시 프로필 페이지로 이동) */}
          {opponentHandle ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={PATHS.USER_PROFILE(opponentHandle)}
                  className="flex items-center gap-1.5 min-w-0 w-fit hover:opacity-70 transition-opacity"
                  aria-label={t("aria.view_profile", {
                    nickname: opponentNickname ?? "",
                  })}
                >
                  {opponentProfileImageUrl && (
                    <Avatar className="h-4.5 w-4.5 shrink-0 border border-stone-200/60 dark:border-stone-700">
                      <AvatarImage
                        src={getProfileImageUrl(opponentProfileImageUrl)}
                      />
                      <AvatarFallback className="text-[10px]">
                        {opponentNickname?.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate leading-tight">
                    {opponentNickname}
                  </p>
                </Link>
              </TooltipTrigger>
              {/* 채팅 위젯 패널이 z-999라 기본 z-50으로는 패널 뒤에 가려진다 */}
              <TooltipContent side="top" align="center" className="z-1000">
                {tCommon("actions.view_profile")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              {opponentProfileImageUrl && (
                <Avatar className="h-4.5 w-4.5 shrink-0 border border-stone-200/60 dark:border-stone-700">
                  <AvatarImage
                    src={getProfileImageUrl(opponentProfileImageUrl)}
                  />
                  <AvatarFallback className="text-[10px]">
                    {opponentNickname?.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate leading-tight">
                {opponentNickname}
              </p>
            </div>
          )}

          {/* 2행: 평소에는 책 정보, 입력 중일 때는 타이핑 안내 표시 */}
          <div
            className="h-4 flex items-center overflow-hidden"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait">
              {typingNickname ? (
                <motion.p
                  key="typing"
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -4, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-emerald-600 font-medium truncate flex items-center gap-1"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {t("typing", { nickname: typingNickname })}
                </motion.p>
              ) : (
                <motion.p
                  key="book-info"
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -4, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-stone-500 dark:text-stone-400 truncate"
                >
                  {bookTitle}
                  {bookPrice !== undefined && (
                    <>
                      <span className="mx-1 text-stone-300 dark:text-stone-600">
                        ·
                      </span>
                      <PriceDisplay
                        value={bookPrice}
                        className="text-xs font-medium text-stone-700 dark:text-stone-300 tabular-nums"
                        unitClassName="font-medium"
                      />
                    </>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 나가기 버튼: 차분한 회색 톤 적용 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={handleLeaveRoom}
        disabled={isInTrade}
        title={
          isInTrade ? t("cannot_leave_during_trade") : t("aria.leave_room")
        }
        aria-label={
          isInTrade ? t("cannot_leave_during_trade") : t("aria.leave_room")
        }
      >
        <LogOut size={18} />
      </Button>
    </div>
  );
};
