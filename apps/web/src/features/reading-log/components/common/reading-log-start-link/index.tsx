"use client";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useReadingLogViewStore } from "../../../stores/use-reading-log-view-store";
import type { ReadingLogViewMode } from "../../calendar-view/reading-log-controls";

/** 소개 페이지의 시작 버튼. 고른 보기로 내 독서 기록을 연다. 로그인하지 않았으면 마이페이지 가드가 로그인 후 여기로 돌려보낸다 */
export function ReadingLogStartLink({
  view,
  children,
}: {
  view: ReadingLogViewMode;
  children: React.ReactNode;
}) {
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);
  return (
    <Link
      href={PATHS.READING_LOG}
      onClick={() => setViewMode(view)}
      className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-[15px] font-semibold text-white hover:bg-emerald-800"
    >
      {children}
    </Link>
  );
}
