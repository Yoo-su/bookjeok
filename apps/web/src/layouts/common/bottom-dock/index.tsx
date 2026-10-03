"use client";

import type { ChatRoom } from "@bookjeok/core";
import { useMyChatRoomsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  DOCK_SEARCH_INPUT_ATTR,
  DockBookSearchField,
} from "@/features/book/components/book-search/dock-book-search-field";
import { RecentBooksPanel } from "@/features/book/components/recent-books/recent-books-panel";
import { useBookSearchUiStore } from "@/features/book/stores/use-book-search-ui-store";
import { useRecentBookStore } from "@/features/book/stores/use-recent-book-store";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useMusicStore } from "@/features/music";
import { ReadingCalendarPanel } from "@/features/reading-log/components/dock-peek/reading-calendar-panel";
import { ReadingStackPanel } from "@/features/reading-log/components/dock-peek/reading-stack-panel";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import {
  ArrowUp,
  CalendarDays,
  Disc3,
  History,
  MessagesSquare,
  Ruler,
  Search,
  X,
} from "@/shared/components/icons/iconsax";
import {
  DOCK_DESKTOP_QUERY,
  FloatingDock,
  type FloatingDockItem,
} from "@/shared/components/ui/floating-dock";
import { usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useHideOnScrollDown } from "@/shared/hooks/use-hide-on-scroll-down";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useScrolledPast } from "@/shared/hooks/use-scrolled-past";
import { cn } from "@/shared/utils/cn";

import { useIsTyping } from "./use-is-typing";

const HIDE_DOCK_ROUTES = [PATHS.LOGIN, PATHS.SIGNUP, "/share"] as const;

const SCROLL_TOP_THRESHOLD = 300;

/** dock 숨김 전환 시간(ms). 아래 래퍼의 duration-300과 같음 */
const FADE_MS = 300;

/** dock 칸 하나(44px + 좌우 4px)와 바깥 여백. 화면에 들어가는 칸 수 계산용 */
const SLOT_PX = 52;
const DOCK_CHROME_PX = 42;

/** 좁은 화면에서 칸이 모자라면 뒤쪽부터 뺌. 다른 곳(헤더 음악 버튼 등)에도 있는 것일수록 뒤 */
const DROP_ORDER = ["recent-books", "music", "scroll-top"];

type DockPanelKey = "recent" | "calendar" | "stack";

/** 안 읽음 합계만 구독해 목록 캐시가 바뀌어도 합계가 같으면 리렌더 안 함 */
const selectTotalUnreadCount = (rooms: ChatRoom[]) =>
  rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);

const iconClass = "h-5 w-5";
const closeIcon = <X className={iconClass} aria-hidden="true" />;

/**
 * 화면 하단 dock. 채팅·기록 달력·키재기·최근 본 책·음악·맨 위로를 한 줄로 모음
 * - 패널(채팅·달력·키재기·최근 본 책)은 한 번에 하나
 * - 독서기록 페이지에서는 달력·키재기가 패널 대신 페이지 보기를 바꿈(탭바 재탭과 같음)
 * - 도서 검색 결과 화면: 히어로 검색창이 가려지면 검색 아이템이 생기고, 누르면 입력창으로 펼침
 * - 다른 화면으로 옮기면 패널을 닫음(채팅은 유지)
 * - 모바일·가로 폰: 아래로 스크롤하거나 입력 중이면 숨김
 */
export const BottomDock = () => {
  const t = useTranslations("common.aria");
  const tBook = useTranslations("book.recent_drawer");
  const tMusic = useTranslations("music.header_button");
  const tSearch = useTranslations("book.search");
  const tPeek = useTranslations("reading_log.peek");
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = useAuthStore((state) => state.user);
  const isLoggedIn = mounted && !!user;

  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const toggleChat = useChatStore((state) => state.toggleChat);
  const closeChat = useChatStore((state) => state.closeChat);
  const { data: unreadCount = 0 } = useMyChatRoomsQuery({
    select: selectTotalUnreadCount,
    enabled: isLoggedIn,
  });

  const [panel, setPanel] = useState<DockPanelKey | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  // 채팅은 다른 화면(판매글·주문)에서도 열리므로 열리는 쪽에서 맞춤
  useEffect(() => {
    if (isChatOpen) setPanel(null);
  }, [isChatOpen]);
  // 로그아웃하면 내 기록 패널을 닫음
  useEffect(() => {
    if (!isLoggedIn) setPanel((p) => (p === "recent" ? p : null));
  }, [isLoggedIn]);
  // 화면을 옮기면 닫음. 뒤로가기·키보드 이동은 바깥 누름 판정을 거치지 않음
  useEffect(() => {
    setPanel(null);
  }, [pathname]);
  const togglePanel = (key: DockPanelKey) => {
    if (panel !== key) closeChat();
    setPanel((p) => (p === key ? null : key));
  };

  const recentCount = useRecentBookStore((state) => state.recentBooks.length);
  const viewMode = useReadingLogViewStore((s) => s.viewMode);
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);

  const isMusicVisible = useMusicStore(
    (state) =>
      state.isPlaying &&
      !state.isModalOpen &&
      Boolean(state.playlist[state.currentIndex] ?? state.playlist[0]),
  );
  const openMusic = useMusicStore((state) => state.toggleModal);

  const isHeroSearchHidden = useBookSearchUiStore(
    (state) => state.isHeroSearchHidden,
  );
  const [isSearchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  // 히어로가 다시 보이면 접어 둠. 다음에 가려질 때 저절로 펼쳐지지 않게
  useEffect(() => {
    if (!isHeroSearchHidden) setSearchOpen(false);
  }, [isHeroSearchHidden]);
  const isSearchExpanded = isSearchOpen && isHeroSearchHidden && !isChatOpen;

  const isScrolled = useScrolledPast(SCROLL_TOP_THRESHOLD);
  const isScrollingDown = useHideOnScrollDown();
  const isTyping = useIsTyping();
  const isDesktop = useMediaQuery(DOCK_DESKTOP_QUERY);

  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    const read = () => setViewportWidth(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const isHiddenRoute = HIDE_DOCK_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isReadingLogPage = pathname === PATHS.READING_LOG;

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const openSearch = () => {
    // iOS는 탭 이벤트 안에서 포커스해야 키보드가 열려 즉시 렌더 후 포커스
    closeChat();
    flushSync(() => {
      setPanel(null);
      setSearchOpen(true);
    });
    document
      .querySelector<HTMLInputElement>(`[${DOCK_SEARCH_INPUT_ATTR}]`)
      ?.focus();
  };

  /** 독서기록 페이지에서는 같은 내용을 패널로 또 띄우지 않고 페이지 보기를 바꿈 */
  const readingItem = (
    key: "calendar" | "stack",
    label: string,
    icon: React.ReactNode,
  ): FloatingDockItem =>
    isReadingLogPage
      ? {
          key,
          label,
          icon,
          current: viewMode === key,
          onClick: () => {
            setViewMode(key);
            scrollToTop();
          },
        }
      : {
          key,
          label,
          icon: panel === key ? closeIcon : icon,
          active: panel === key,
          onClick: () => togglePanel(key),
        };

  const allItems: FloatingDockItem[] = [];
  if (isHeroSearchHidden) {
    allItems.push({
      key: "search",
      label: tSearch("button_label"),
      icon: <Search className={iconClass} aria-hidden="true" />,
      onClick: openSearch,
    });
  }
  if (isLoggedIn) {
    allItems.push(
      {
        key: "chat",
        label: t(isChatOpen ? "chat_close" : "chat_open"),
        icon: isChatOpen ? (
          closeIcon
        ) : (
          <MessagesSquare className={iconClass} aria-hidden="true" />
        ),
        onClick: toggleChat,
        badge: isChatOpen ? 0 : unreadCount,
        active: isChatOpen,
      },
      readingItem(
        "calendar",
        tPeek("calendar_title"),
        <CalendarDays className={iconClass} aria-hidden="true" />,
      ),
      readingItem(
        "stack",
        tPeek("stack_title"),
        <Ruler className={iconClass} aria-hidden="true" />,
      ),
    );
  }
  if (recentCount > 0) {
    allItems.push({
      key: "recent-books",
      label: tBook("title"),
      icon:
        panel === "recent" ? (
          closeIcon
        ) : (
          <History className={iconClass} aria-hidden="true" />
        ),
      onClick: () => togglePanel("recent"),
      active: panel === "recent",
    });
  }
  if (isMusicVisible) {
    allItems.push({
      key: "music",
      label: tMusic("aria_label"),
      icon: (
        <Disc3
          className={cn(iconClass, "animate-spin text-emerald-600")}
          style={{ animationDuration: "3s" }}
          aria-hidden="true"
        />
      ),
      onClick: openMusic,
    });
  }
  if (isScrolled) {
    allItems.push({
      key: "scroll-top",
      label: t("scroll_top"),
      icon: <ArrowUp className={iconClass} aria-hidden="true" />,
      onClick: scrollToTop,
    });
  }

  // 320px 폰은 5칸, 375px는 6칸. 넘치면 DROP_ORDER 순으로 뺌(열려 있는 건 남김)
  const maxItems = viewportWidth
    ? Math.max(3, Math.floor((viewportWidth - DOCK_CHROME_PX) / SLOT_PX))
    : allItems.length;
  const dropped = new Set<string>();
  for (const key of DROP_ORDER) {
    if (allItems.length - dropped.size <= maxItems) break;
    const item = allItems.find((i) => i.key === key);
    if (item && !item.active) dropped.add(key);
  }
  const items = allItems.filter((i) => !dropped.has(i.key));

  // 마지막 아이템이 빠져도 페이드아웃이 끝날 때까지 직전 모습을 그림. 바로 지우면 툭 사라짐
  const isEmpty = items.length === 0;
  const lastItemsRef = useRef<FloatingDockItem[]>([]);
  if (!isEmpty) lastItemsRef.current = items;
  const [hasFadedOut, setHasFadedOut] = useState(true);
  useEffect(() => {
    if (!isEmpty) {
      setHasFadedOut(false);
      return;
    }
    const id = window.setTimeout(() => setHasFadedOut(true), FADE_MS);
    return () => window.clearTimeout(id);
  }, [isEmpty]);
  const shownItems = isEmpty && !hasFadedOut ? lastItemsRef.current : items;

  if (!mounted || isHiddenRoute) return null;

  const isPanelOpen = isChatOpen || panel !== null;
  // 채팅 닫기 버튼과 검색 입력창이 dock 안에 있으므로 그동안은 숨기지 않음
  const isScrollHidden =
    !isDesktop &&
    !isPanelOpen &&
    !isSearchExpanded &&
    (isScrollingDown || isTyping);
  const isHidden = isEmpty || isScrollHidden;

  return (
    <>
      <div
        inert={isHidden}
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center transition-[opacity,translate,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          isHidden && "invisible translate-y-6 opacity-0",
        )}
      >
        {shownItems.length > 0 && (
          <FloatingDock
            items={shownItems}
            ariaLabel={t("dock")}
            magnify={!isPanelOpen}
            expanded={
              isSearchExpanded && <DockBookSearchField onClose={closeSearch} />
            }
            className="pointer-events-auto"
          />
        )}
      </div>
      <RecentBooksPanel open={panel === "recent"} onClose={closePanel} />
      {isLoggedIn && (
        <>
          <ReadingCalendarPanel
            open={panel === "calendar"}
            onClose={closePanel}
          />
          <ReadingStackPanel open={panel === "stack"} onClose={closePanel} />
        </>
      )}
    </>
  );
};
