"use client";

import type { LoungeBookCard } from "@bookjeok/core";
import { useLoungeBookReadersInfiniteQuery } from "@bookjeok/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { ImpressionArea } from "@/shared/components/common/impression-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface LoungeBookDetailModalProps {
  isbn: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialBook?: LoungeBookCard["book"] | null;
  initialTotalCount?: number;
}

export function LoungeBookDetailModal({
  isbn,
  isOpen,
  onClose,
  initialBook,
  initialTotalCount,
}: LoungeBookDetailModalProps) {
  const t = useTranslations("lounge.detail_modal");
  const tLounge = useTranslations("lounge");
  const locale = useLocale();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLoungeBookReadersInfiniteQuery(isbn || "", isOpen && !!isbn);

  const book = data?.pages[0]?.book || initialBook;
  const readers = data?.pages.flatMap((page) => page.items) || [];
  const totalCount = data?.pages[0]?.totalCount ?? initialTotalCount ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">
          {tLounge("readers_title")}
        </DialogTitle>
        <div className="relative flex flex-col h-[80vh] md:h-[70vh] max-h-[800px]">
          {/* 헤더 */}
          <div className="flex items-start gap-4 p-5 border-b border-stone-100 bg-white sticky top-0 z-10">
            <div className="relative shrink-0 w-14 aspect-2/3 rounded-lg overflow-hidden bg-stone-50 shadow-sm">
              {book?.image ? (
                <Image
                  src={book.image}
                  alt={book.title || ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-1.5">
                  <span className="text-[9px] text-stone-300 text-center">
                    Book
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h2 className="font-serif text-lg font-semibold text-stone-900 line-clamp-1">
                {book?.title || "..."}
              </h2>
              <p className="text-sm text-stone-400 font-light line-clamp-1">
                {book?.author}
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full bg-stone-100 text-[11px] font-medium text-stone-600">
                {t("total_readers", { count: totalCount })}
              </div>
            </div>
          </div>

          {/* 본문 (독자 리스트) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : readers.length > 0 ? (
              <div className="py-2">
                {readers.map((reader, index) => (
                  <motion.div
                    key={`${reader.userId}-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(index * 0.04, 0.4),
                      duration: 0.3,
                    }}
                  >
                    <Link
                      href={PATHS.USER_PROFILE(reader.handle)}
                      onClick={onClose}
                      className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-stone-50 transition-colors group"
                    >
                      {/* 프로필 아바타 */}
                      <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-stone-100">
                        <Image
                          src={getProfileImageUrl(reader.profileImageUrl) || ""}
                          alt={reader.nickname}
                          fill
                          // 다른 아바타처럼 원본을 그대로 쓴다. 초기 소셜 가입자의
                          // 네이버·카카오 프로필 주소는 이미지 허용 호스트에 없다
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      {/* 사용자 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-semibold text-stone-900 group-hover:text-stone-600 transition-colors">
                            {reader.nickname}
                          </p>
                          <p className="text-[11px] text-stone-400 font-light">
                            {formatRelativeTime(reader.date, locale)}
                          </p>
                        </div>
                        {reader.memo && (
                          <p className="text-sm text-stone-500 font-light wrap-break-word line-clamp-2 leading-relaxed">
                            &ldquo;{reader.memo}&rdquo;
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}

                <ImpressionArea
                  onImpression={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      fetchNextPage();
                    }
                  }}
                  className="p-4 flex justify-center"
                >
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                      <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1 h-1 bg-stone-300 rounded-full animate-bounce" />
                      <span className="ml-1 font-light">{t("loading")}</span>
                    </div>
                  )}
                </ImpressionArea>
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-stone-400 text-sm font-light">
                  {t("empty")}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
