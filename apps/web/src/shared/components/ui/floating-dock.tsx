"use client";

import {
  AnimatePresence,
  motion,
  type MotionValue,
  type Transition,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils/cn";

export interface FloatingDockItem {
  key: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  /** 0이면 표시 안 함 */
  badge?: number;
  /** 열린 상태 표시. 토글 버튼의 aria-pressed */
  active?: boolean;
  /** 지금 보고 있는 화면. 아이콘 아래 점과 aria-current로 표시 */
  current?: boolean;
  /** 누를 것 같을 때(마우스 올림·터치 시작·포커스). 패널 데이터를 미리 받는 데 씀 */
  onIntent?: () => void;
}

/** dock 루트 표식. 패널의 바깥 누름 판정에서 dock을 뺄 때 씀 */
export const FLOATING_DOCK_ATTR = "data-floating-dock";

/**
 * 카드 패널·항상 보이는 dock을 쓰는 화면. 나머지는 바텀시트·스크롤 시 숨김
 * - 높이도 봄. 가로로 눕힌 폰(높이 약 320~430px)은 너비가 md를 넘어도 카드가 200px 남짓으로 짜부라짐
 */
export const DOCK_DESKTOP_QUERY = "(min-width: 768px) and (min-height: 500px)";

interface FloatingDockProps {
  items: FloatingDockItem[];
  ariaLabel: string;
  /** false면 마우스 확대·툴팁을 끔. 위에 패널이 붙어 있을 때 아이콘·툴팁이 패널을 파고들지 않게 */
  magnify?: boolean;
  /** 있으면 아이콘 대신 이 내용으로 펼침(예: 검색 입력창). 내용은 dock 너비를 채움 */
  expanded?: ReactNode;
  className?: string;
}

const BASE_SIZE = 44;
const PEAK_SIZE = 60;
const REACH = 120;
/** 펼친 너비 상한(26rem). 화면이 좁으면 좌우 1rem씩 남김 */
const EXPANDED_MAX_WIDTH = 416;

/**
 * 튕김 없는 감속 곡선. bounce 0 스프링은 꼬리가 길어 지정 시간에 끊기며 마지막에 몇 px 툭 맞춰짐
 */
const MORPH: Transition = { duration: 0.38, ease: [0.32, 0.72, 0, 1] };

/** 사라지는 내용은 빨리, 나타나는 내용은 모양이 어느 정도 바뀐 뒤 */
const CONTENT_OUT: Transition = { duration: 0.1 };
const CONTENT_IN: Transition = { duration: 0.18, delay: 0.12 };

/**
 * 하단 dock. Aceternity UI Floating Dock 기반
 * - 마우스에서만 확대·툴팁. 터치는 고정 크기
 * - 블러 없는 단색 배경
 * - 크기 변화는 transform이 아닌 실제 너비로 애니메이션. scale 보정은 펼침 중 내용이 밖으로 삐져나옴
 * - 펼친 내용은 dock 위에 겹쳐(absolute) 항상 dock 너비를 채움. 아이콘 줄은 그대로 두고 투명도만 바꿔
 *   접힌 너비의 기준이 됨. 퇴장 요소를 흐름에서 빼는 popLayout은 사라지기 직전 한 프레임 번쩍임
 */
export const FloatingDock = ({
  items,
  ariaLabel,
  magnify = true,
  expanded,
  className,
}: FloatingDockProps) => {
  const mouseX = useMotionValue(Infinity);
  const isExpanded = Boolean(expanded);

  // 펼친 뒤 접힘이 끝날 때까지 확대를 끔. 접힘 목표 너비는 시작할 때 재므로
  // 그사이 아이콘 크기가 바뀌면 끝에서 auto로 바뀌며 툭 줄어듦
  const isMorphLockedRef = useRef(false);
  useEffect(() => {
    if (!isExpanded) return;
    isMorphLockedRef.current = true;
    mouseX.set(Infinity);
  }, [isExpanded, mouseX]);

  useEffect(() => {
    if (!magnify) mouseX.set(Infinity);
  }, [magnify, mouseX]);

  // 전환 중에만 잘라냄. 평소에는 툴팁이 위로 나가야 함
  const navAnimate = isExpanded
    ? {
        width: Math.min(EXPANDED_MAX_WIDTH, window.innerWidth - 32),
        overflow: "hidden",
      }
    : {
        width: "auto",
        overflow: "hidden",
        transitionEnd: { overflow: "visible" },
      };

  return (
    <motion.nav
      {...{ [FLOATING_DOCK_ATTR]: "" }}
      aria-label={ariaLabel}
      initial={false}
      animate={navAnimate}
      transition={MORPH}
      onAnimationComplete={() => {
        if (!isExpanded) isMorphLockedRef.current = false;
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !magnify || isMorphLockedRef.current) {
          return;
        }
        mouseX.set(e.clientX);
      }}
      onPointerLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex rounded-full border border-stone-200 bg-white shadow-[0_8px_30px_-10px_rgba(28,25,23,0.3)]",
        className,
      )}
    >
      {/* 여백은 안쪽에 둠. framer는 width를 잴 때 padding을 빼서 애니메이션 끝에 그만큼 툭 맞춰짐 */}
      <div className="relative flex min-w-0 flex-1 items-end justify-center p-1">
        <motion.div
          initial={false}
          animate={
            isExpanded
              ? { opacity: 0, transition: CONTENT_OUT }
              : { opacity: 1, transition: CONTENT_IN }
          }
          inert={isExpanded}
          className="flex items-end"
        >
          <AnimatePresence initial={false}>
            {items.map(({ key, ...item }) => (
              <DockIcon
                key={key}
                mouseX={mouseX}
                showTooltip={magnify}
                {...item}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: CONTENT_IN }}
              exit={{ opacity: 0, transition: CONTENT_OUT }}
              className="absolute inset-1 flex items-center"
            >
              {expanded}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

const DockIcon = ({
  mouseX,
  label,
  icon,
  onClick,
  href,
  badge = 0,
  active,
  current,
  onIntent,
  showTooltip,
}: Omit<FloatingDockItem, "key"> & {
  mouseX: MotionValue<number>;
  showTooltip: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return x - bounds.x - bounds.width / 2;
  });
  const size = useSpring(
    useTransform(
      distance,
      [-REACH, 0, REACH],
      [BASE_SIZE, PEAK_SIZE, BASE_SIZE],
    ),
    { mass: 0.1, stiffness: 160, damping: 13 },
  );

  const iconClass =
    "group relative flex size-full items-center justify-center rounded-full text-stone-600 transition-[background-color,color,scale] duration-150 hover:bg-stone-100 active:scale-90 active:bg-stone-200 motion-reduce:active:scale-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-700 aria-pressed:bg-stone-900 aria-pressed:text-white";

  // 배지는 버튼(44px)이 아닌 아이콘(20px) 모서리에 붙임. 버튼 모서리는 평소 배경이 없어 떠 보임.
  // 링은 뒤 배경색과 맞춰 아이콘 선을 끊어 냄
  const content = (
    <span className="relative inline-flex">
      {icon}
      {badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none tabular-nums text-white ring-2 ring-white transition-[box-shadow] duration-150 group-hover:ring-stone-100 group-active:ring-stone-200"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {current && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-600"
        />
      )}
    </span>
  );

  // 배지 숫자를 이름에 포함해 스크린리더가 읽게 함
  const accessibleName = badge > 0 ? `${label} (${badge})` : label;

  return (
    // 등장·퇴장은 칸 너비를 0↔auto로 바꿔 dock이 실제로 늘고 줄게 함. 전환 중에만 잘라냄
    <motion.div
      initial={{ width: 0, opacity: 0, overflow: "hidden" }}
      animate={{
        width: "auto",
        opacity: 1,
        overflow: "hidden",
        transitionEnd: { overflow: "visible" },
      }}
      exit={{ width: 0, opacity: 0, overflow: "hidden" }}
      transition={MORPH}
      className="shrink-0"
    >
      <div className="px-1">
        <motion.div
          ref={ref}
          style={{ width: size, height: size }}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setHovered(true);
            onIntent?.();
          }}
          onPointerLeave={() => setHovered(false)}
          // 터치는 손가락이 닿는 순간이 클릭보다 100ms 남짓 이름
          onPointerDown={onIntent}
          onFocus={onIntent}
          className="relative"
        >
          <AnimatePresence>
            {hovered && showTooltip && (
              <motion.span
                initial={{ opacity: 0, y: 6, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 2, x: "-50%" }}
                transition={{ duration: 0.15 }}
                aria-hidden="true"
                className="pointer-events-none absolute -top-8 left-1/2 whitespace-pre rounded-md bg-stone-900 px-2 py-0.5 text-xs text-white"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {href ? (
            <Link href={href} aria-label={accessibleName} className={iconClass}>
              {content}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              aria-label={accessibleName}
              aria-pressed={active}
              aria-current={current ? "page" : undefined}
              className={cn(iconClass, current && "text-stone-900")}
            >
              {content}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
