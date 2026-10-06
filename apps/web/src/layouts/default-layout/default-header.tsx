"use client";

import { motion, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import { type PointerEvent, useEffect, useState } from "react";
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

type UnderlineState = "idle" | "preview" | "active";

// 현재 메뉴는 진하게 긋고, 마우스를 올린 메뉴는 연필로 흐리게 미리 긋는다.
// 지울 때는 그은 방향 반대로 되감겨 사라진다.
const UNDERLINE_VARIANTS: Variants = {
  idle: {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: { duration: 0.3, ease: [0.4, 0, 1, 1] },
      opacity: { delay: 0.25, duration: 0.05 },
    },
  },
  preview: {
    pathLength: 1,
    opacity: 0.25,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  active: {
    pathLength: 1,
    opacity: 0.6,
    transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
  },
};

// 손글씨 느낌의 꼬불꼬불한 용수철 밑줄 SVG 컴포넌트 (True Looped Spring)
const HandDrawnUnderline = ({ state }: { state: UnderlineState }) => (
  <svg
    className="absolute left-0 -top-2.5 w-full h-3 pointer-events-none text-stone-900"
    viewBox="0 0 100 10"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <motion.path
      d="M 0 9 C 5 9 8 2 4 2 S 4 9 16 9 C 21 9 24 2 20 2 S 20 9 32 9 C 37 9 40 2 36 2 S 36 9 48 9 C 53 9 56 2 52 2 S 52 9 64 9 C 69 9 72 2 68 2 S 68 9 80 9 C 85 9 88 2 84 2 S 84 9 96 9 Q 99 9 100 2"
      stroke="currentColor"
      strokeWidth="0.6"
      fill="none"
      vectorEffect="non-scaling-stroke"
      variants={UNDERLINE_VARIANTS}
      initial="idle"
      animate={state}
    />
  </svg>
);

/** 마우스로 올렸을 때만 켜진다. 터치의 가짜 hover와 키보드 포커스는 무시한다 */
function useMouseHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    hoverProps: {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === "mouse") setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
    },
  };
}

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

const NAV_ITEM_CLASS =
  "group relative inline-flex items-center gap-1.5 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200";

// 챕터 인덱스는 값이 바뀌지 않는 정적 레이블이라 mono가 할 일이 없다.
// 알약은 Pretendard를 물려받으므로 명조체를 명시해 드롭다운·드로어와 맞춘다.
// 마우스를 올리면 책장 귀퉁이를 들추듯 살짝 올라간다.
const indexNumClass = (active: boolean) =>
  cn(
    "font-[family-name:var(--font-gowun-batang)] text-[11px] tabular-nums select-none shrink-0",
    "transition-[color,translate] duration-200 motion-reduce:transition-none",
    active
      ? "text-stone-900 font-semibold"
      : "text-stone-400/90 group-hover:text-stone-700 group-hover:-translate-y-0.5",
  );

interface ChapterLinkProps {
  href: string;
  index: string;
  label: string;
  active: boolean;
}

const ChapterLink = ({ href, index, label, active }: ChapterLinkProps) => {
  const { hovered, hoverProps } = useMouseHover();
  return (
    <Link
      href={href}
      {...hoverProps}
      className={cn(
        NAV_ITEM_CLASS,
        active ? "text-stone-900" : "text-stone-500 hover:text-stone-900",
      )}
    >
      <span className={indexNumClass(active)}>{index}</span>
      <span className="tracking-tight">{label}</span>
      <HandDrawnUnderline
        state={active ? "active" : hovered ? "preview" : "idle"}
      />
    </Link>
  );
};

interface ChapterMenuItem {
  href: string;
  label: string;
  /** 비로그인이면 로그인 후 돌아올 곳으로 기억한다 */
  requiresAuth?: boolean;
}

interface ChapterMenuProps {
  index: string;
  label: string;
  active: boolean;
  items: ChapterMenuItem[];
  isLoggedIn: boolean;
}

const ChapterMenu = ({
  index,
  label,
  active,
  items,
  isLoggedIn,
}: ChapterMenuProps) => {
  const { hovered, hoverProps } = useMouseHover();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          {...hoverProps}
          className={cn(
            NAV_ITEM_CLASS,
            "outline-none cursor-pointer",
            active ? "text-stone-900" : "text-stone-500 hover:text-stone-900",
          )}
        >
          <span className={indexNumClass(active)}>{index}</span>
          <span className="tracking-tight">{label}</span>
          <span
            className={cn(
              "ml-0.5 text-[9px] text-stone-400 group-hover:text-stone-700",
              "transition-[color,rotate] duration-200 motion-reduce:transition-none",
              open && "rotate-180 text-stone-700",
            )}
          >
            ▾
          </span>
          {/* 펼쳐 둔 동안에는 마우스가 패널로 내려가도 미리 그은 밑줄을 남긴다 */}
          <HandDrawnUnderline
            state={active ? "active" : hovered || open ? "preview" : "idle"}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={DROPDOWN_SIDE_OFFSET}
        className="w-44 p-1.5 rounded-lg border border-stone-200/90 bg-white/95 backdrop-blur-md shadow-lg shadow-stone-900/5 font-[family-name:var(--font-gowun-batang)]"
      >
        <DropdownMenuGroup>
          {items.map((item, i) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              // 패널이 열린 뒤 항목이 위에서부터 한 줄씩 내려앉는다
              style={{ animationDelay: `${60 + i * 40}ms` }}
              className="group/item rounded-md px-3 py-2 cursor-pointer hover:bg-stone-100/70 focus:bg-stone-100/70 outline-none transition-colors animate-in fade-in-0 slide-in-from-top-1 duration-300 fill-mode-backwards motion-reduce:animate-none"
            >
              <Link
                href={item.href}
                onClick={
                  item.requiresAuth && !isLoggedIn
                    ? () => saveReturnUrl(item.href)
                    : undefined
                }
                className="flex items-center justify-between w-full text-xs font-medium text-stone-700 group-hover/item:text-stone-900"
              >
                <span>{item.label}</span>
                <span className="text-[10.5px] tabular-nums text-stone-400 group-hover/item:text-stone-600">
                  {index}.{i + 1}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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

  const isActive = (path: string) => !!pathname?.startsWith(path);
  // 비로그인이면 가드에 막히는 내 독서 기록 대신 공개 소개로 보낸다
  const readingLogHref = currentUser
    ? PATHS.READING_LOG
    : PATHS.READING_LOG_INTRO;

  return (
    // 바깥 래퍼는 배경이 없다. 흐름 안에 남는 sticky라 레이아웃이 밀리지 않으면서,
    // 알약 위아래 여백으로 본문이 지나가는 것이 비쳐 떠 있는 것처럼 보인다.
    <header
      data-site-header
      className="sticky top-0 z-50 w-full px-3 py-2.5 sm:px-4 sm:py-3"
    >
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
          <ChapterLink
            href={PATHS.LOUNGE}
            index="01"
            label={t("nav.menu_lounge")}
            active={isActive(PATHS.LOUNGE)}
          />
          <ChapterLink
            href={readingLogHref}
            index="02"
            label={t("nav.menu_log")}
            active={isActive(readingLogHref)}
          />
          <ChapterMenu
            index="03"
            label={t("nav.menu_reviews")}
            active={isActive(PATHS.REVIEWS)}
            isLoggedIn={!!currentUser}
            items={[
              { href: PATHS.REVIEWS, label: t("nav.review_feed") },
              {
                href: PATHS.REVIEW_WRITE,
                label: t("nav.write_review"),
                requiresAuth: true,
              },
              {
                href: PATHS.MY_REVIEWS,
                label: t("nav.my_reviews"),
                requiresAuth: true,
              },
            ]}
          />
          <ChapterMenu
            index="04"
            label={t("nav.menu_market")}
            active={isActive(PATHS.BOOK_MARKET)}
            isLoggedIn={!!currentUser}
            items={[
              { href: PATHS.BOOK_MARKET, label: t("nav.market_home") },
              {
                href: PATHS.BOOK_SALES_REGISTER,
                label: t("nav.write_sales"),
                requiresAuth: true,
              },
              {
                href: PATHS.MY_PAGE_SALES,
                label: t("nav.my_sales"),
                requiresAuth: true,
              },
            ]}
          />
          <ChapterLink
            href={PATHS.BOOK_SEARCH}
            index="05"
            label={t("nav.menu_search")}
            active={isActive(PATHS.BOOK_SEARCH)}
          />
        </nav>

        {/* 우측: 사용자 메뉴 & BGM */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 sm:gap-3 lg:flex-1">
          {/* 폰에서는 숨기고 모바일 시트 상단에 둔다 */}
          <HeaderMusicButton className="hidden sm:inline-flex" />
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
            <Link
              href={PATHS.LOGIN}
              onClick={() => saveReturnUrl(pathname)}
              className="-mr-2 inline-flex items-center px-3 py-2"
            >
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
