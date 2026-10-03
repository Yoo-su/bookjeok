"use client";

import {
  motion,
  type Transition,
  useDragControls,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { X } from "@/shared/components/icons/iconsax";
import { useBodyScrollLock } from "@/shared/hooks/use-body-scroll-lock";
import { useKeyboardInset } from "@/shared/hooks/use-keyboard-inset";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useSiteHeaderHeight } from "@/shared/hooks/use-site-header-height";
import { cn } from "@/shared/utils/cn";

import { DOCK_DESKTOP_QUERY, FLOATING_DOCK_ATTR } from "./floating-dock";

interface DockPanelProps {
  open: boolean;
  onClose: () => void;
  /** 보조기술용 이름 */
  label: string;
  children: ReactNode;
  /** 데스크톱 크기. 너비·높이 클래스(최대 높이는 desktopMaxHeight) */
  desktopClassName?: string;
  /** 데스크톱 최대 높이. 헤더와 dock 사이 공간이 더 작으면 그만큼 줄임 */
  desktopMaxHeight?: string;
  /** 모바일 시트 높이 클래스. 기본은 화면의 85% */
  mobileClassName?: string;
  /** 모바일 최대 높이. 헤더 아래까지만 */
  mobileMaxHeight?: string;
  /** 패널 밖을 누르면 닫음. 채팅처럼 열어 둔 채 페이지를 보는 패널은 false */
  dismissOnOutsideClick?: boolean;
}

/** dock과 같은 감속 곡선 */
const EASE: Transition = { duration: 0.38, ease: [0.32, 0.72, 0, 1] };

/**
 * 데스크톱: dock 바로 위에서 알약 모양으로 시작해 카드로 펼침.
 * clip-path로 잘라 보여 주므로 내용은 처음부터 최종 크기로 그려져 찌그러지지 않음
 */
const DESKTOP_VARIANTS: Variants = {
  open: {
    clipPath: "inset(0% 0% 0% 0% round 24px)",
    opacity: 1,
    y: 0,
    visibility: "visible",
  },
  closed: {
    clipPath: "inset(88% 30% 0% 30% round 28px)",
    opacity: 0,
    y: 10,
    transitionEnd: { visibility: "hidden" },
  },
};

const SHEET_VARIANTS: Variants = {
  open: { y: 0, visibility: "visible" },
  closed: { y: "100%", transitionEnd: { visibility: "hidden" } },
};

/** dock 위 패널 바닥: 화면 바닥 1rem + dock 54px + 간격 10px */
const DESKTOP_BOTTOM = "1rem + 64px + env(safe-area-inset-bottom)";
/** 헤더와 패널 사이 최소 간격(px) */
const HEADER_GAP = { desktop: 12, mobile: 8 };

/** 아래로 이만큼 끌거나 빠르게 튕기면 시트를 닫음 */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 600;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 모달 시트 안에서 Tab을 돌림. 배경이 덮여 있어 밖으로 나가면 포커스를 잃음 */
const trapTab = (e: React.KeyboardEvent<HTMLElement>) => {
  const sheet = e.currentTarget;
  // 시트에서 띄운 확인창(포털)의 키 입력도 여기로 올라옴. 그쪽은 Radix가 가둠
  if (e.key !== "Tab" || !sheet.contains(e.target as Node)) return;
  const items = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!first) {
    e.preventDefault();
  } else if (e.shiftKey && (active === first || active === sheet)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
};

/**
 * 하단 dock에서 여는 패널. 데스크톱은 dock 위 카드, 모바일·가로 폰은 바텀시트(`DOCK_DESKTOP_QUERY`)
 * - 내용은 `group-data-[layout=card]/dock-panel:` 로 카드일 때만 스타일을 줄 수 있음
 * - 한 번 열면 닫아도 마운트 유지. 닫힌 동안은 visibility·inert로 숨김
 *   (채팅 말풍선·이미지를 다시 그리면 웹킷이 재디코딩하느라 버벅임)
 * - Esc로 닫힘. 모바일은 배경 누름·핸들 끌어내림·닫기 버튼으로도 닫힘
 * - 열면 포커스를 패널로 옮기고 닫으면 연 자리로 돌려줌. 모바일 시트는 모달이라 Tab을 가둠
 */
export const DockPanel = ({
  open,
  onClose,
  label,
  children,
  desktopClassName,
  desktopMaxHeight = "40rem",
  mobileClassName = "h-[85dvh]",
  mobileMaxHeight = "88dvh",
  dismissOnOutsideClick = false,
}: DockPanelProps) => {
  const t = useTranslations("common.aria");
  const isDesktop = useMediaQuery(DOCK_DESKTOP_QUERY);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  // 헤더(z-50)가 패널 위에 있어 넘치면 윗부분이 헤더 뒤로 숨음. 헤더 아래까지만 키움
  const headerHeight = useSiteHeaderHeight();

  const [hasOpened, setHasOpened] = useState(open);
  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  useBodyScrollLock(open && !isDesktop);
  const keyboard = useKeyboardInset(open && !isDesktop);

  useEffect(() => {
    if (!open || !dismissOnOutsideClick || !isDesktop) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || panelRef.current?.contains(target)) return;
      // dock 버튼은 자기 토글로 처리. 패널에서 띄운 대화상자·팝오버도 바깥이 아님
      if (
        target.closest(
          `[${FLOATING_DOCK_ATTR}], [role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]`,
        )
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, dismissOnOutsideClick, isDesktop, onClose]);

  // 열면 패널로 포커스를 옮김(입력창이 아니라 패널 자체라 모바일 키보드는 안 뜸).
  // 닫힐 때 포커스가 안에 있었으면 연 버튼으로 돌려줌. inert가 되면 포커스가 body로 빠짐
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const opener =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null;
    // 열리는 첫 프레임은 아직 visibility hidden이라 포커스가 안 잡혀 보일 때까지 다시 시도.
    // 그사이 사용자가 다른 곳으로 옮겼으면 두기
    let frame = 0;
    const focusPanel = (tries: number) => {
      const active = document.activeElement;
      if (active !== opener && active !== document.body) return;
      panel.focus({ preventScroll: true });
      if (document.activeElement !== panel && tries > 0) {
        frame = requestAnimationFrame(() => focusPanel(tries - 1));
      }
    };
    if (!opener || !panel.contains(opener)) focusPanel(5);
    return () => {
      cancelAnimationFrame(frame);
      if (!panel.contains(document.activeElement)) return;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else panel.blur();
    };
  }, [open]);

  // 포커스가 dock 버튼에 있어도 Esc로 닫히게 문서에서 받음
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // 패널에서 띄운 확인창이 열려 있으면 그것만 닫히게 둠
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
        )
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!hasOpened && !open) return null;

  const state = open ? "open" : "closed";

  if (isDesktop) {
    return (
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        data-layout="card"
        initial="closed"
        animate={state}
        variants={DESKTOP_VARIANTS}
        transition={EASE}
        style={{
          bottom: `calc(${DESKTOP_BOTTOM})`,
          maxHeight: `min(${desktopMaxHeight}, calc(100dvh - (${DESKTOP_BOTTOM}) - ${headerHeight + HEADER_GAP.desktop}px))`,
        }}
        className={cn(
          "group/dock-panel hide-scrollbars fixed inset-x-0 z-[45] mx-auto flex flex-col overflow-hidden rounded-3xl outline-none border border-stone-200 bg-white shadow-[0_16px_50px_-12px_rgba(28,25,23,0.35)]",
          desktopClassName,
          !open && "pointer-events-none",
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={EASE}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[45] bg-black/40",
          !open && "pointer-events-none",
        )}
      />
      {/* 가로 폰처럼 넓은 화면은 카드 정도 폭으로 가운데 둠. 꽉 채우면 표지·달력 칸이 커져 한 줄도 안 보임 */}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-label={label}
        aria-modal="true"
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        onKeyDown={trapTab}
        data-layout="sheet"
        initial="closed"
        animate={state}
        variants={SHEET_VARIANTS}
        transition={EASE}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (
            info.offset.y > DISMISS_OFFSET ||
            info.velocity.y > DISMISS_VELOCITY
          ) {
            onClose();
          }
        }}
        // 키보드가 뜨면 보이는 영역 바닥에 붙이고 그 높이에 맞춤
        style={{
          bottom: keyboard.bottom,
          height: keyboard.visibleHeight ?? undefined,
          maxHeight: `min(${mobileMaxHeight}, calc(100dvh - ${headerHeight + HEADER_GAP.mobile}px))`,
        }}
        className={cn(
          "group/dock-panel hide-scrollbars fixed inset-x-0 z-[45] mx-auto flex flex-col overflow-hidden rounded-t-3xl outline-none bg-white sm:max-w-lg pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_-12px_rgba(28,25,23,0.35)]",
          mobileClassName,
          !open && "pointer-events-none",
        )}
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="relative flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        >
          <span className="h-1 w-10 rounded-full bg-stone-300" />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label={t("close")}
            className="absolute right-2 top-0 flex size-9 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </motion.div>
    </>
  );
};
