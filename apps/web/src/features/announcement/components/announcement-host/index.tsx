"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { usePathname } from "@/shared/config/i18n/routing";

import {
  type AnnouncementId,
  canAnnounceOn,
  pickAnnouncement,
} from "../../constants/announcements";
import { useAnnouncementStore } from "../../stores/use-announcement-store";
import type { AnnouncementProps } from "../../types";

/** 공지 id별 소개 모달. 필요할 때만 불러온다. 공지를 추가하고 여기를 빠뜨리면 타입 오류가 난다 */
const INTROS: Record<AnnouncementId, ComponentType<AnnouncementProps>> = {
  "reading-stack": dynamic(
    () =>
      import("../reading-stack-intro").then((m) => ({
        default: m.ReadingStackIntro,
      })),
    { ssr: false },
  ),
};

/** 페이지가 뜨자마자 덮지 않고 잠시 뒤에 연다 */
export const ANNOUNCE_DELAY_MS = 1500;

/**
 * 새 기능 소개를 접속 시 한 번 띄운다. 닫으면 본 것으로 기록한다.
 * 다른 모달이 열려 있으면 이번에는 건너뛰고 다음 이동 때 다시 본다.
 * 한 번에 하나만 띄운다. 기간이 겹치는 공지가 여럿이면 나머지는 다음 접속 때 차례로 뜬다.
 */
export function AnnouncementHost() {
  const pathname = usePathname();
  const loggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const seen = useAnnouncementStore((s) => s.seen);
  const markSeen = useAnnouncementStore((s) => s.markSeen);
  const [current, setCurrent] = useState<{
    id: AnnouncementId;
    open: boolean;
  } | null>(null);

  useEffect(() => {
    if (current) return;
    const target = pickAnnouncement(Date.now(), seen);
    if (!target || !canAnnounceOn(pathname, loggedIn)) return;
    const timer = setTimeout(() => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      setCurrent({ id: target.id, open: true });
    }, ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current, seen, pathname, loggedIn]);

  if (!current) return null;
  const onOpenChange = (open: boolean) => {
    if (open) return;
    markSeen(current.id);
    // 닫힘 애니메이션이 끝나도록 컴포넌트는 남겨 둔다
    setCurrent({ ...current, open: false });
  };
  const Intro = INTROS[current.id];
  return <Intro open={current.open} onOpenChange={onOpenChange} />;
}
