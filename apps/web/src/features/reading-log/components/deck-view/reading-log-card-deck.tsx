"use client";

import { ReadingLog } from "@bookjeok/core";
import { useReadingLogsQuery } from "@bookjeok/react-query";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/shared/components/aceternityui/draggable-card";
import { BookOpen, Quote, Share2 } from "@/shared/components/icons/iconsax";
import { parseCalendarDate } from "@/shared/utils/format-date";

interface ReadingLogCardDeckProps {
  logs?: ReadingLog[];
  currentDate?: Date;
  onShareClick?: () => void;
  isSharedPage?: boolean;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function ReadingLogCardDeck({
  logs,
  currentDate = new Date(),
  onShareClick,
  isSharedPage = false,
  readOnly = false,
  isLoading = false,
}: ReadingLogCardDeckProps) {
  const t = useTranslations("reading_log");
  const user = useAuthStore((state) => state.user);
  const [isMobile, setIsMobile] = useState(false);

  // logs prop이 전달되지 않은 경우 자체적으로 최근 독서기록 50개 조회
  const { data: fetchedLogs = [], isLoading: isQueryLoading } =
    useReadingLogsQuery({ limit: 50 }, { enabled: !readOnly && !logs });

  const effectiveLogs = logs || fetchedLogs;
  const effectiveLoading = isLoading || (!logs && isQueryLoading);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const copyShareLink = () => {
    if (onShareClick) {
      onShareClick();
      return;
    }
    const userHandle = user?.handle || user?.nickname || user?.id;
    if (!userHandle) {
      toast.error(t("toast.login_required_share"));
      return;
    }
    const shareUrl = `${window.location.origin}/share/deck/${encodeURIComponent(userHandle)}?year=${currentDate.getFullYear()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t("toast.share_deck_copied"));
  };

  if (effectiveLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-6 min-h-[260px] sm:min-h-[480px] relative overflow-visible">
        <div className="relative w-[145px] sm:w-[320px] h-[210px] sm:h-[480px] bg-white border border-stone-200 p-2 sm:p-4 pb-4 sm:pb-8 flex flex-col items-center justify-center animate-pulse shadow-lg rounded-none">
          <div className="w-full h-32 sm:h-64 bg-stone-200 mb-2 sm:mb-4" />
          <div className="w-3/4 h-3 sm:h-4 bg-stone-200 mb-1 sm:mb-2" />
          <div className="w-1/2 h-2 sm:h-3 bg-stone-200" />
        </div>
      </div>
    );
  }

  if (!effectiveLogs || effectiveLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-stone-200 shadow-xl max-w-md mx-auto min-h-[360px]">
        <div className="p-4 bg-stone-50 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-stone-300" />
        </div>
        <h3 className="text-xl font-serif font-semibold text-stone-850 mb-2">
          {t("list.empty")}
        </h3>
        <p className="text-stone-400 text-xs font-light max-w-xs leading-relaxed">
          {t("deck.empty_sub")}
        </p>
      </div>
    );
  }

  // 최신 읽은 순(날짜 내림차순) 정렬 및 최대 50개 제한
  const sortedLogs = [...effectiveLogs]
    .sort(
      (a, b) =>
        parseCalendarDate(b.date).getTime() -
        parseCalendarDate(a.date).getTime(),
    )
    .slice(0, 50);

  // Polaroid photo scattered angles & positions with zIndex (최신 책 index 0이 맨 위에 오도록)
  const getPolaroidStyle = (index: number, total: number) => {
    const rotations = [-5, 4, -2, 6, -4, 5, -7, 3];
    const rotation = rotations[index % rotations.length];
    const offsetStep = isMobile ? 6 : 14;
    const topOffset = (index % 5) * offsetStep;
    const leftOffset = (index % 5) * (isMobile ? 4 : 10);

    return {
      transform: `rotate(${rotation}deg)`,
      top: `${topOffset}px`,
      left: `calc(50% - ${isMobile ? 72 : 160}px + ${leftOffset}px)`,
      zIndex: total - index,
    };
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 relative overflow-visible select-none min-h-[290px] sm:min-h-[660px]">
      <DraggableCardContainer className="relative flex min-h-[260px] sm:min-h-[620px] w-full items-center justify-center overflow-visible p-2 sm:p-4">
        {sortedLogs.map((log, index) => {
          const polaroidStyle = getPolaroidStyle(index, sortedLogs.length);

          return (
            <DraggableCardBody
              key={log.id || index}
              style={polaroidStyle}
              className="absolute cursor-grab active:cursor-grabbing select-none w-[145px] sm:w-[320px] min-h-[200px] sm:min-h-[500px] p-2 sm:p-4 pb-3 sm:pb-6 bg-white border border-stone-300/80 rounded-none sm:rounded-sm shadow-[0_10px_25px_rgba(0,0,0,0.12)] sm:shadow-[0_18px_45px_rgba(0,0,0,0.16)] flex flex-col justify-between transition-shadow hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)] sm:hover:shadow-[0_25px_60px_rgba(0,0,0,0.22)] z-10"
            >
              {/* ===== 폴라로이드 사진 영역 (Polaroid Photo Slot) ===== */}
              <div className="relative w-full h-[140px] sm:h-[280px] bg-stone-900 border border-stone-300/60 overflow-hidden shadow-inner flex items-center justify-center group shrink-0">
                {log.book.image ? (
                  <Image
                    src={log.book.image}
                    alt={log.book.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 145px, 320px"
                    className="pointer-events-none object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800 p-2 text-center">
                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 text-stone-500" />
                    <p className="text-[10px] sm:text-xs font-serif text-stone-300 line-clamp-2">
                      {log.book.title}
                    </p>
                  </div>
                )}
              </div>

              {/* ===== 폴라로이드 하단 턱 (Polaroid Bottom Margin & Details) ===== */}
              <div className="flex-1 flex flex-col justify-between pt-1.5 sm:pt-3 px-0.5 sm:px-1 min-h-0">
                {/* 도서 제목 */}
                <div className="shrink-0">
                  <h4 className="text-[11px] sm:text-base font-bold font-serif text-stone-900 line-clamp-1 leading-snug break-keep">
                    {log.book.title}
                  </h4>
                  <p className="hidden sm:block text-[11px] text-stone-500 font-medium truncate mt-0.5">
                    {log.book.author}
                  </p>
                </div>

                {/* PC 전용: 손글씨 / 테이프 스타일 한줄평 (Memo Caption) */}
                <div className="hidden sm:flex relative mt-2 p-2.5 bg-amber-50/70 rounded-xs border-l-2 border-amber-500/70 items-start gap-2 overflow-hidden flex-1 min-h-[50px]">
                  <Quote className="w-3 h-3 text-amber-700/60 shrink-0 mt-0.5 rotate-180" />
                  <div className="flex-1 overflow-hidden">
                    {log.memo ? (
                      <p className="text-stone-800 text-[11px] sm:text-xs font-serif italic leading-relaxed line-clamp-2 break-keep">
                        {log.memo}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 font-serif italic leading-relaxed">
                        {t("deck.empty_memo")}
                      </p>
                    )}
                  </div>
                </div>

                {/* PC 전용: 폴라로이드 스탬프 & 독서 완료 일자 */}
                <div className="hidden sm:flex items-center justify-between pt-2 mt-1 border-t border-stone-100 text-[10px] font-mono text-stone-400 uppercase tracking-widest shrink-0">
                  <span>{format(parseCalendarDate(log.date), "yyyy.MM.dd")}</span>
                  <span className="font-semibold text-stone-300">
                    INSTAX • BOOKJEOK
                  </span>
                </div>
              </div>
            </DraggableCardBody>
          );
        })}
      </DraggableCardContainer>

      {/* 하단 공유 링크 복사 버튼 */}
      {!isSharedPage && !readOnly && (
        <div className="mt-6 flex justify-center z-10">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors active:scale-95 duration-200 cursor-pointer bg-white px-4 py-2 rounded-full border border-stone-300 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" />
            {t("deck.copy_link")}
          </button>
        </div>
      )}
    </div>
  );
}
