"use client";

import { BookInfo, bookKeys } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { BookOpen } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSafeSubmit } from "@/shared/hooks/use-safe-submit";
import { cn } from "@/shared/utils";

import { useCreateReadingLogMutation } from "../../../mutations";
import {
  ReadingLogFormDialog,
  ReadingLogFormValues,
} from "../reading-log-form-dialog";

interface MarkAsReadButtonProps {
  book: Pick<BookInfo, "isbn" | "title" | "author" | "image">;
  className?: string;
}

/** 도서 화면에서 날짜를 먼저 고르지 않고 바로 독서 기록을 남긴다. */
export function MarkAsReadButton({ book, className }: MarkAsReadButtonProps) {
  const t = useTranslations("reading_log.mark_as_read");
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const createMutation = useCreateReadingLogMutation();
  const { executeSafeSubmit } = useSafeSubmit();

  const handleClick = () => {
    if (!user) {
      saveReturnUrl(pathname);
      router.push(PATHS.LOGIN);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = ({ memo, date }: ReadingLogFormValues) => {
    executeSafeSubmit(async (idempotencyKey) => {
      await createMutation.mutateAsync(
        { isbn: book.isbn, date, memo, idempotencyKey },
        {
          onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({
              queryKey: bookKeys.stats(book.isbn).queryKey,
            });
          },
        },
      );
    }).catch(() => {
      // 실패 안내는 뮤테이션 onError가 띄운다. 폼은 열어 둔다.
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={cn(
          "h-11 px-6 border-stone-200 text-stone-700 hover:bg-stone-50",
          className,
        )}
      >
        <BookOpen aria-hidden="true" />
        {t("button")}
      </Button>

      <ReadingLogFormDialog
        mode="create"
        book={book}
        initialDate={format(new Date(), "yyyy-MM-dd")}
        open={open}
        isPending={createMutation.isPending}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
