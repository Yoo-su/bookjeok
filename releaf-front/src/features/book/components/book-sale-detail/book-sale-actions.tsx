"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clock, Edit, Eye, Loader2, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { findOrCreateRoom } from "@/features/chat/apis";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { WishlistButton } from "@/features/user/components/wishlist-button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { Separator } from "@/shared/components/shadcn/separator";
import { PATHS } from "@/shared/constants/paths";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { useSocketContext } from "@/shared/providers/socket-provider";
import { formatPostDate } from "@/shared/utils/date";

import { useDeleteBookSaleMutation } from "../../mutations";
import { UsedBookSale } from "../../types";
import { SaleStatusBadge } from "../common/sale-status-badge";

interface BookSaleActionsProps {
  sale: UsedBookSale;
  isOwner: boolean;
}

export const BookSaleActions = ({ sale, isOwner }: BookSaleActionsProps) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { openChatRoom } = useChatStore();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { mutate: deleteSale, isPending: isDeleting } =
    useDeleteBookSaleMutation();

  const displayDate =
    sale.updatedAt > sale.createdAt ? sale.updatedAt : sale.createdAt;
  const dateLabel = sale.updatedAt > sale.createdAt ? "수정" : "작성";

  const discountRate =
    Number(sale.book.discount) > 0
      ? Math.round(
          ((Number(sale.book.discount) - sale.price) /
            Number(sale.book.discount)) *
            100
        )
      : 0;

  const handleDelete = () => {
    if (
      window.confirm(
        "정말로 이 판매글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다."
      )
    ) {
      deleteSale({ saleId: sale.id, imageUrls: sale.imageUrls });
    }
  };

  const handleStartChat = async () => {
    setIsCreatingChat(true);
    try {
      // 1. API를 통해 채팅방을 생성 또는 조회합니다.
      const newRoom = await findOrCreateRoom(sale.id);

      // 2. 새로 생성된 채팅방에 소켓을 조인시킵니다.
      if (socket) {
        socket.emit("joinRooms", [newRoom.id]);
      }

      // 3. 채팅방 목록 쿼리를 무효화하여 최신 목록을 다시 불러옵니다.
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
      });

      // 4. 채팅 위젯에서 해당 채팅방을 엽니다.
      openChatRoom(newRoom.id, queryClient);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error("채팅방을 여는 데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2 text-sm text-gray-500">
          <SaleStatusBadge status={sale.status} />
          <span>
            {sale.city} {sale.district}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {dateLabel} {formatPostDate(displayDate)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{sale.viewCount.toLocaleString()}</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {sale.title}
        </h1>
        <p className="mt-4 text-2xl font-bold text-emerald-600">
          {sale.price.toLocaleString()}원
          {discountRate > 0 && (
            <span className="ml-3 text-lg font-medium text-gray-400 line-through">
              {Number(sale.book.discount).toLocaleString()}원
            </span>
          )}
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={sale.user.profileImageUrl || undefined}
              alt={sale.user.nickname}
            />
            <AvatarFallback>{sale.user.nickname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-800">{sale.user.nickname}</p>
            <p className="text-sm text-gray-500">판매자</p>
          </div>
        </div>
        {isOwner ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                <Edit className="w-4 h-4 mr-2" />
                수정
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            {sale.status === "FOR_SALE" && (
              <WishlistButton
                type="SALE"
                id={sale.id}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 w-11 rounded-md"
              />
            )}
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={handleStartChat}
              disabled={isCreatingChat}
            >
              {isCreatingChat ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5 mr-2" />
              )}
              {isCreatingChat ? "채팅방 여는 중..." : "판매자와 채팅하기"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <div className="prose max-w-none text-gray-700 min-h-[200px] bg-gray-50/50 p-6 rounded-xl border border-gray-100">
        <p className="whitespace-pre-wrap leading-relaxed">{sale.content}</p>
      </div>
    </div>
  );
};
