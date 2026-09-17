"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { HeaderMusicButton } from "@/features/music";
import { NotificationPopover } from "@/features/notification/components/notification-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useScrolledPast } from "@/shared/hooks/use-scrolled-past";
import { cn } from "@/shared/utils/cn";
import { consumeSessionToast } from "@/shared/utils/session";

import { LanguageSwitcher } from "../common/language-switcher";
import { Logo } from "../common/logo";
import { MobileNavSheet } from "./mobile-nav-sheet";
import UserPopover from "./user-popover";

// 손글씨 느낌의 꼬불꼬불한 용수철 밑줄 SVG 컴포넌트 (True Looped Spring)
const HandDrawnUnderline = () => (
  <svg
    className="absolute left-0 -top-2.5 w-full h-3 pointer-events-none text-stone-900"
    viewBox="0 0 100 10"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <style>{`
      @keyframes draw-spring {
        from { stroke-dashoffset: 1; }
        to { stroke-dashoffset: 0; }
      }
    `}</style>
    <path
      d="M 0 9 C 5 9 8 2 4 2 S 4 9 16 9 C 21 9 24 2 20 2 S 20 9 32 9 C 37 9 40 2 36 2 S 36 9 48 9 C 53 9 56 2 52 2 S 52 9 64 9 C 69 9 72 2 68 2 S 68 9 80 9 C 85 9 88 2 84 2 S 84 9 96 9 Q 99 9 100 2"
      stroke="currentColor"
      strokeWidth="0.6"
      fill="none"
      vectorEffect="non-scaling-stroke"
      className="opacity-60"
      pathLength="1"
      style={{
        strokeDasharray: 1,
        strokeDashoffset: 1,
        animation: "draw-spring 1s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      }}
    />
  </svg>
);

/**
 * 헤더 알약이 넓어지기 시작하는 스크롤 위치(px).
 *
 * 첫 화면에서는 본문 폭(max-w-5xl)에 맞춰 떠 있다가, 사용자가 읽기 시작하면
 * 넓어지며 배경에서 분리됩니다. 너무 이르면 스크롤 몇 px에 헤더가 들썩입니다.
 */
const HEADER_EXPAND_SCROLL_Y = 300;

/**
 * 드롭다운이 트리거에서 떨어지는 거리(px).
 *
 * 기본값(4px)은 헤더가 전체 폭 바였을 때의 값이다. 알약이 된 뒤로는 트리거가
 * 알약 **안쪽**에 있어, 4px로 열면 패널이 알약 아래 테두리를 파고든다.
 * 알약 하단까지의 여백을 넘겨서 패널이 알약 바깥에 온전히 떨어지게 한다.
 */
const DROPDOWN_SIDE_OFFSET = 22;

export const DefaultHeader = () => {
  const t = useTranslations("header");
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isExpanded = useScrolledPast(HEADER_EXPAND_SCROLL_Y);

  useEffect(() => {
    setMounted(true);
    // 하드 내비게이션으로 끝난 세션(로그아웃 등)의 토스트를 이어서 표시
    const pendingMessage = consumeSessionToast();
    if (pendingMessage) toast.success(pendingMessage);
  }, []);

  const currentUser = mounted ? user : null;

  const isActive = (path: string) => pathname?.startsWith(path);

  const getLinkClass = (path: string) =>
    cn(
      "group relative inline-flex items-center gap-1.5 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200",
      isActive(path) ? "text-stone-900" : "text-stone-500 hover:text-stone-900",
    );

  const getIndexNumClass = (path: string) =>
    cn(
      "font-mono text-[10px] tabular-nums tracking-wider select-none transition-colors duration-200 shrink-0",
      isActive(path)
        ? "text-stone-900 font-semibold"
        : "text-stone-400/90 group-hover:text-stone-700",
    );

  const dropdownContentClass =
    "w-44 p-1.5 rounded-lg border border-stone-200/90 bg-white/95 backdrop-blur-md shadow-lg shadow-stone-900/5 font-[family-name:var(--font-gowun-batang)]";
  const dropdownItemClass =
    "group/item rounded-md px-3 py-2 cursor-pointer hover:bg-stone-100/70 focus:bg-stone-100/70 outline-none transition-colors";
  const dropdownLinkClass =
    "flex items-center justify-between w-full text-xs font-medium text-stone-700 group-hover/item:text-stone-900";

  return (
    // 바깥 래퍼는 배경이 없다. 흐름 안에 남는 sticky라 레이아웃이 밀리지 않으면서,
    // 알약 위아래 여백으로 본문이 지나가는 것이 비쳐 떠 있는 것처럼 보인다.
    <header className="sticky top-0 z-50 w-full px-3 py-2.5 sm:px-4 sm:py-3">
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between rounded-full border border-stone-200/70 bg-white/80 px-4 py-2.5 backdrop-blur-xl sm:px-6",
          // 폭·그림자만 전환한다. 메뉴 구성이 스크롤에 따라 바뀌면 누르려던 것이
          // 움직이므로 건드리지 않는다.
          "transition-[max-width,box-shadow,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          isExpanded
            ? "max-w-7xl bg-white/90 shadow-[0_10px_40px_-12px_rgba(28,25,23,0.22)]"
            : "max-w-5xl shadow-[0_4px_20px_-10px_rgba(28,25,23,0.16)]",
        )}
      >
        {/* 좌측: 모바일 메뉴 + 로고 */}
        {/*
          lg부터 좌우 그룹이 `flex-1`(basis 0)로 남은 공간을 정확히 반씩 나눈다.
          그래서 알약이 넓어질 때 로고와 우측 메뉴만 바깥으로 밀려나고 가운데
          내비게이션은 화면 정중앙에 붙박인다. lg 미만에서는 내비게이션이 없으므로
          기존 `justify-between` 배치를 그대로 쓴다.
        */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:flex-1">
          {/* 모바일 햄버거 메뉴 */}
          <MobileNavSheet />

          <Logo />
        </div>

        {/* 중앙: 데스크탑 에디토리얼 챕터 인덱스 네비게이션 */}
        <nav
          className="hidden lg:flex items-center gap-5.5 xl:gap-7 whitespace-nowrap shrink-0 font-[family-name:var(--font-gowun-batang)]"
          aria-label={t("nav.main_menu")}
        >
          {/* 01. 도서 검색 */}
          <Link
            href={PATHS.BOOK_SEARCH}
            className={getLinkClass(PATHS.BOOK_SEARCH)}
          >
            <span className={getIndexNumClass(PATHS.BOOK_SEARCH)}>01</span>
            <span className="tracking-tight">{t("nav.menu_search")}</span>
            {isActive(PATHS.BOOK_SEARCH) && <HandDrawnUnderline />}
          </Link>

          {/* 02. 독서 기록 */}
          <Link
            href={PATHS.READING_LOG}
            onClick={
              !currentUser ? () => saveReturnUrl(PATHS.READING_LOG) : undefined
            }
            className={getLinkClass(PATHS.READING_LOG)}
          >
            <span className={getIndexNumClass(PATHS.READING_LOG)}>02</span>
            <span className="tracking-tight">{t("nav.menu_log")}</span>
            {isActive(PATHS.READING_LOG) && <HandDrawnUnderline />}
          </Link>

          {/* 03. 라운지 */}
          <Link href={PATHS.LOUNGE} className={getLinkClass(PATHS.LOUNGE)}>
            <span className={getIndexNumClass(PATHS.LOUNGE)}>03</span>
            <span className="tracking-tight">{t("nav.menu_lounge")}</span>
            {isActive(PATHS.LOUNGE) && <HandDrawnUnderline />}
          </Link>

          {/* 04. 중고마켓 그룹 */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "group relative inline-flex items-center gap-1.5 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 outline-none cursor-pointer",
                  isActive(PATHS.BOOK_MARKET)
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-900",
                )}
              >
                <span className={getIndexNumClass(PATHS.BOOK_MARKET)}>04</span>
                <span className="tracking-tight">{t("nav.menu_market")}</span>
                <span className="text-[9px] text-stone-400 group-hover:text-stone-700 transition-colors ml-0.5">
                  ▾
                </span>
                {isActive(PATHS.BOOK_MARKET) && <HandDrawnUnderline />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={DROPDOWN_SIDE_OFFSET}
              className={dropdownContentClass}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link href={PATHS.BOOK_MARKET} className={dropdownLinkClass}>
                    <span>{t("nav.market_home")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      04.1
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link
                    href={PATHS.BOOK_SALES_REGISTER}
                    onClick={
                      !currentUser
                        ? () => saveReturnUrl(PATHS.BOOK_SALES_REGISTER)
                        : undefined
                    }
                    className={dropdownLinkClass}
                  >
                    <span>{t("nav.write_sales")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      04.2
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link
                    href={PATHS.MY_PAGE_SALES}
                    onClick={
                      !currentUser
                        ? () => saveReturnUrl(PATHS.MY_PAGE_SALES)
                        : undefined
                    }
                    className={dropdownLinkClass}
                  >
                    <span>{t("nav.my_sales")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      04.3
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 05. 리뷰 그룹 */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "group relative inline-flex items-center gap-1.5 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 outline-none cursor-pointer",
                  isActive(PATHS.REVIEWS)
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-900",
                )}
              >
                <span className={getIndexNumClass(PATHS.REVIEWS)}>05</span>
                <span className="tracking-tight">{t("nav.menu_reviews")}</span>
                <span className="text-[9px] text-stone-400 group-hover:text-stone-700 transition-colors ml-0.5">
                  ▾
                </span>
                {isActive(PATHS.REVIEWS) && <HandDrawnUnderline />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={DROPDOWN_SIDE_OFFSET}
              className={dropdownContentClass}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link href={PATHS.REVIEWS} className={dropdownLinkClass}>
                    <span>{t("nav.review_feed")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      05.1
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link
                    href={PATHS.REVIEW_WRITE}
                    onClick={
                      !currentUser
                        ? () => saveReturnUrl(PATHS.REVIEW_WRITE)
                        : undefined
                    }
                    className={dropdownLinkClass}
                  >
                    <span>{t("nav.write_review")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      05.2
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link
                    href={PATHS.MY_REVIEWS}
                    onClick={
                      !currentUser
                        ? () => saveReturnUrl(PATHS.MY_REVIEWS)
                        : undefined
                    }
                    className={dropdownLinkClass}
                  >
                    <span>{t("nav.my_reviews")}</span>
                    <span className="font-mono text-[9.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                      05.3
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 06. 인사이트 */}
          <Link href={PATHS.INSIGHTS} className={getLinkClass(PATHS.INSIGHTS)}>
            <span className={getIndexNumClass(PATHS.INSIGHTS)}>06</span>
            <span className="tracking-tight">{t("nav.menu_insights")}</span>
            {isActive(PATHS.INSIGHTS) && <HandDrawnUnderline />}
          </Link>
        </nav>

        {/* 우측: 사용자 메뉴 & BGM */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 sm:gap-3 lg:flex-1">
          {/*
            폰에서는 숨긴다. 로그인 상태의 우측 그룹(BGM 84 + 알림 44 + 아바타 40)에
            좌측 로고까지 더하면 360px 기기에서 알약 안쪽 폭을 넘긴다.
            진입점은 모바일 내비게이션 시트가 대신 갖는다.
          */}
          <div className="hidden sm:flex">
            <HeaderMusicButton />
          </div>
          <LanguageSwitcher className="hidden lg:flex shrink-0" />
          {!mounted ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100/80 animate-pulse border border-stone-200/40 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-stone-200/50" />
              </div>
              <div className="w-10 h-10 rounded-full bg-stone-200/60 animate-pulse border border-stone-200/40" />
            </div>
          ) : currentUser ? (
            <>
              <div className="mr-1">
                <NotificationPopover />
              </div>
              <UserPopover />
            </>
          ) : (
            <Link href={PATHS.LOGIN} onClick={() => saveReturnUrl(pathname)}>
              <span className="text-sm font-medium font-[family-name:var(--font-gowun-batang)] text-stone-500 hover:text-stone-900 transition-colors tracking-wide">
                {t("nav.menu_login")}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
