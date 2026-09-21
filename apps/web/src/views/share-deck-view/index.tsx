"use client";

import { usePublicUserProfileQuery } from "@bookjeok/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { ReadingLogCardDeck } from "@/features/reading-log/components/deck-view/reading-log-card-deck";
import { BookOpen, User } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { parseCalendarDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface ShareDeckViewProps {
  handle: string;
  year?: number;
}

export function ShareDeckView({ handle, year }: ShareDeckViewProps) {
  const t = useTranslations("reading_log");
  const { data: profile, isLoading, error } = usePublicUserProfileQuery(handle);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-stone-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* 배경 데코레이션 요소 */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-stone-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-stone-850/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 border-4 border-stone-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 text-xs font-serif animate-pulse">
            {t("deck.loading_message")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-dvh bg-stone-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="flex flex-col items-center gap-6 relative z-10 max-w-sm text-center">
          <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center border border-stone-800 text-stone-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif mb-2">
              {t("deck.error_title")}
            </h3>
            <p className="text-stone-400 text-xs leading-relaxed break-keep">
              {t("deck.error_desc")}
            </p>
          </div>
          <Link href={PATHS.HOME}>
            <Button className="bg-stone-800 hover:bg-stone-700 text-xs font-semibold rounded-full px-6">
              {t("deck.go_home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 연도가 지정되었으면 해당 연도의 독서 기록만 필터링, 없으면 전체 최신 기록 50개
  const displayLogs = profile.readingLogs
    ? (year
        ? profile.readingLogs.filter(
            // 달력 날짜라 new Date()에 그냥 넣으면 UTC 자정이 된다. UTC보다
            // 뒤진 타임존에서는 1월 1일 기록이 전년으로 밀려 덱에서 사라진다.
            (log) => parseCalendarDate(log.date).getFullYear() === year,
          )
        : profile.readingLogs
      )
        .sort(
          (a, b) =>
            parseCalendarDate(b.date).getTime() -
            parseCalendarDate(a.date).getTime(),
        )
        .slice(0, 50)
    : [];

  return (
    <div className="min-h-dvh bg-stone-950 text-white flex flex-col justify-between py-12 px-6 relative overflow-hidden">
      {/* 세련된 우주/어두운 톤 배경 데코 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-stone-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-stone-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* 헤더 영역 */}
      <header className="w-full max-w-md mx-auto flex flex-col items-center text-center relative z-20 shrink-0">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-stone-900 shadow-xl mb-4">
          {getProfileImageUrl(profile.profileImageUrl) ? (
            <Image
              src={getProfileImageUrl(profile.profileImageUrl)!}
              alt={profile.nickname}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-600">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold font-serif tracking-tight flex items-center gap-1.5 justify-center break-keep">
          {year
            ? t("deck.share_title", { name: profile.nickname, year })
            : t("deck.share_title_all", { name: profile.nickname })}
        </h1>
        <p className="text-xs text-stone-400 mt-1 max-w-xs font-light break-keep">
          {t("deck.share_subtitle", { count: displayLogs.length })}
        </p>
      </header>

      {/* 메인 독서 카드 덱 뷰 영역 */}
      <main className="flex-1 w-full max-w-md mx-auto flex items-center justify-center relative z-10">
        <ReadingLogCardDeck
          logs={displayLogs}
          currentDate={year ? new Date(year, 0, 1) : new Date()}
          isSharedPage={true}
        />
      </main>

      {/* 푸터 영역 / 나만의 독서 덱 만들기 유도 */}
      <footer className="w-full max-w-md mx-auto text-center relative z-20 flex flex-col items-center gap-4 shrink-0 pt-6">
        <Link href={PATHS.HOME}>
          <button className="px-6 py-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-full text-xs font-semibold shadow-md active:scale-95 duration-200 transition-all cursor-pointer">
            {t("deck.create_my_deck")}
          </button>
        </Link>
        <p className="text-[10px] text-stone-500 tracking-wider font-light break-keep">
          {t("deck.footer_brand")}
        </p>
      </footer>
    </div>
  );
}
