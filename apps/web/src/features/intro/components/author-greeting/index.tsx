"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type {
  PeekAction,
  PeekSide,
} from "@/features/reading-log/components/stack-view/author-peek";
import { STACK_AUTHOR_IDS } from "@/features/reading-log/components/stack-view/lib/authors";
import type { StackAuthor } from "@/features/reading-log/components/stack-view/lib/types";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

const AuthorPeek = dynamic(
  () =>
    import("@/features/reading-log/components/stack-view/author-peek").then(
      (m) => ({ default: m.AuthorPeek }),
    ),
  { ssr: false },
);

/** 머리글 옆 여백이 캐릭터가 설 만큼 넉넉한 화면 폭(px). 좁으면 띄우지 않는다 */
export const GREETING_MIN_WIDTH = 1024;
/** 첫 등장과 그 뒤 간격(ms). 자주 나오면 금방 거슬린다 */
export const GREETING_FIRST_MS = 3500;
const GAP_MS: [number, number] = [5000, 10000];
/** 한 번 방문에 나오는 최대 횟수 */
export const GREETING_MAX = 6;
const FIGURE_HEIGHT = 270;

const pick = <T,>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/**
 * 홈 「주목할 만한 도서」 머리글 옆으로 작가가 슬라이더 좌우 끝(max-w-5xl)에서 나와 인사한다.
 * 부모는 position: relative이고 슬라이더와 같은 폭·위쪽이어야 한다.
 */
export function AuthorGreeting() {
  const layerRef = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const [wide, setWide] = useState(false);
  const [shot, setShot] = useState<{
    author: StackAuthor;
    side: PeekSide;
    action: PeekAction;
    key: number;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  // 조건이 맞지 않아 건너뛴 차례를 다시 예약한다
  const [retry, setRetry] = useState(0);
  const inView = useRef(false);
  const count = useRef(0);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const measure = () =>
      setWide(document.documentElement.clientWidth >= GREETING_MIN_WIDTH);
    measure();
    window.addEventListener("resize", measure);
    const io = new IntersectionObserver(
      ([e]) => (inView.current = e.isIntersecting),
      { threshold: 0.6 },
    );
    io.observe(layer);
    return () => {
      window.removeEventListener("resize", measure);
      io.disconnect();
    };
  }, []);

  // 쉬었다가 조건이 맞으면 한 번 내보낸다. 보이지 않거나 다른 창이 떠 있으면 다음 차례로 넘긴다
  useEffect(() => {
    if (reduce || !wide || playing || count.current >= GREETING_MAX) return;
    const wait =
      count.current === 0
        ? GREETING_FIRST_MS
        : GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]);
    const id = setTimeout(() => {
      const busy =
        document.visibilityState !== "visible" ||
        !inView.current ||
        document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (busy) {
        setRetry((v) => v + 1);
        return;
      }
      count.current += 1;
      setPlaying(true);
      setShot({
        author: pick(STACK_AUTHOR_IDS),
        side: pick(["left", "right"] as const),
        action: pick(["bow", "wave", "heart"] as const),
        key: count.current,
      });
    }, wait);
    return () => clearTimeout(id);
  }, [reduce, wide, playing, retry]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[330px] overflow-hidden"
    >
      {shot && wide && !reduce && (
        <AuthorPeek
          key={shot.key}
          author={shot.author}
          side={shot.side}
          action={shot.action}
          height={FIGURE_HEIGHT}
          playKey={shot.key}
          // 숨은 뒤에도 남겨 두면 선 떨림 애니메이션이 화면 밖에서 계속 돈다
          onDone={() => {
            setPlaying(false);
            setShot(null);
          }}
        />
      )}
    </div>
  );
}
