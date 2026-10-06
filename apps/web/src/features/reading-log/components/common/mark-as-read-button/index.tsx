"use client";

import { BookInfo, bookKeys } from "@bookjeok/core";
import { useReadingLogBookStatusQuery } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [justSaved]);

  // 사물·키를 넘은 기록은 장면이 축하하므로 토스트로 알린 평범한 저장만 체크로 답한다
  const createMutation = useCreateReadingLogMutation({
    onAnnounced: (kind) => setJustSaved(kind === "toast"),
  });
  const { executeSafeSubmit } = useSafeSubmit();

  // 폼 열 때만 조회. 저장 중엔 멈춰 저장 직후 무효화로 닫히는 폼에서 재조회 방지
  const { data: bookStatus } = useReadingLogBookStatusQuery(book.isbn, {
    enabled: open && !createMutation.isPending,
  });

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
          "h-11 px-3 border-stone-200 text-stone-700 hover:bg-stone-50",
          className,
        )}
      >
        {/* 저장 직후 잠깐 체크로 바뀜 */}
        <span aria-hidden="true" className="relative size-4">
          <AnimatePresence initial={false} mode="popLayout">
            {justSaved ? (
              <motion.svg
                key="check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="absolute inset-0 text-emerald-600"
              >
                <motion.polyline
                  points="20 6 9 17 4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
                />
              </motion.svg>
            ) : (
              <motion.span
                key="book"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <BookOpen />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {t("button")}
      </Button>

      <ReadingLogFormDialog
        mode="create"
        book={book}
        initialDate={format(new Date(), "yyyy-MM-dd")}
        bookStatus={bookStatus}
        open={open}
        isPending={createMutation.isPending}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
