"use client";

import { ChatRoom, SaleAuthor } from "@bookjeok/core";
import { useSelectBuyerMutation } from "@bookjeok/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ShoppingBagIcon } from "@/shared/components/icons";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { PriceDisplay } from "@/shared/components/ui/price-display";

interface SelectBuyerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  buyer: SaleAuthor;
}

export const SelectBuyerModal = ({
  open,
  onOpenChange,
  room,
  buyer,
}: SelectBuyerModalProps) => {
  const t = useTranslations("chat.trade.select_buyer_modal");
  const tCommon = useTranslations("common");

  const selectBuyerMutation = useSelectBuyerMutation({
    onSuccess: () => {
      toast.success(t("success"));
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(t("error", { error: error.message || "" }));
    },
  });

  if (!buyer || !room?.usedBookSale) {
    return null;
  }

  const handleConfirm = () => {
    selectBuyerMutation.mutate({
      saleId: room.usedBookSale.id,
      buyerId: buyer.id,
      chatRoomId: room.id,
    });
  };

  const bookImage =
    room.usedBookSale.book?.image || "/images/placeholder-image.svg";
  const bookTitle = room.usedBookSale.book?.title || room.usedBookSale.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-stone-900 dark:text-stone-100">
            <ShoppingBagIcon className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 상품 정보 카드 */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="relative w-12 h-16 shrink-0 rounded-md overflow-hidden shadow-2xs border border-stone-200 dark:border-stone-700">
              <Image
                src={bookImage}
                alt={bookTitle}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-stone-400 font-medium">
                {t("book_title")}
              </p>
              <h4 className="font-semibold text-sm truncate text-stone-900 dark:text-stone-100">
                {bookTitle}
              </h4>
              <PriceDisplay
                value={room.usedBookSale.price}
                className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5 tabular-nums"
                unitClassName="text-xs font-medium"
              />
            </div>
          </div>

          {/* 구매자 및 거래 안내 */}
          <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
              <AlertCircle className="w-4 h-4 text-stone-500 shrink-0" />
              <span>{t("notice_title", { nickname: buyer.nickname })}</span>
            </div>
            <p className="leading-relaxed pl-5.5 text-stone-600 dark:text-stone-400">
              {t("notice")}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={selectBuyerMutation.isPending}
            className="border-stone-200 dark:border-stone-700"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectBuyerMutation.isPending}
            className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 font-medium"
          >
            {selectBuyerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {tCommon("actions.saving")}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {t("confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
