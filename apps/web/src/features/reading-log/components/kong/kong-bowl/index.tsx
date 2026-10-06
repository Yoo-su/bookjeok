"use client";

import { useAnimate } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { SceneNodes } from "../../stack-view/lib/scene-svg";
import { rng } from "../../stack-view/lib/sketch";
import { useKongFlail } from "../hooks/use-kong-flail";
import { FlailingKong } from "../kong-figure/flailing-kong";
import { BOWL_ASPECT, BOWL_RIM_Y, buildBowl } from "../lib/kong-art";

const WIDTH = 240;
const HEIGHT = WIDTH * BOWL_ASPECT;
const BEAN = 38;
/** 종지에 그리는 최대 알 수. 넘으면 숫자로만 */
export const KONG_BOWL_MAX_DRAWN = 30;
/** 아래 줄부터 한 줄에 담는 알 수 */
const ROW_CAPS = [7, 6, 5, 4, 3, 2, 2, 1];

interface HeapSpot {
  left: number;
  top: number;
  rotate: number;
  row: number;
}

/** 아래 줄부터 소복이 쌓는다. 시드를 고정해 다시 그려도 자리가 같다 */
function heapSpots(count: number): HeapSpot[] {
  const r = rng(17);
  const spots: HeapSpot[] = [];
  // 맨 아래 줄 콩의 발이 종지 안쪽 테두리 아래로 묻힌다
  const base = WIDTH * BOWL_RIM_Y + 14;
  let left = Math.min(count, KONG_BOWL_MAX_DRAWN);
  for (let row = 0; left > 0; row++) {
    const cap = ROW_CAPS[row] ?? 1;
    const n = Math.min(cap, left);
    const span = (cap - 1) * 29;
    for (let i = 0; i < n; i++) {
      const x =
        WIDTH / 2 -
        span / 2 +
        (cap === 1 ? 0 : (i * span) / (cap - 1)) +
        // 덜 찬 줄은 가운데로 모은다
        ((cap - n) * span) / (cap - 1 || 1) / 2 +
        (r() - 0.5) * 7;
      const y = base - row * 17 + (r() - 0.5) * 5;
      spots.push({
        left: x - BEAN / 2,
        top: y - BEAN,
        rotate: (r() - 0.5) * 40,
        row,
      });
    }
    left -= n;
  }
  return spots;
}

function HeapKong({
  spot,
  index,
  hop,
}: {
  spot: HeapSpot;
  index: number;
  hop: number;
}) {
  const flail = useKongFlail();
  const [scope, animate] = useAnimate<HTMLSpanElement>();

  useEffect(() => {
    if (!hop || flail.reduced) return;
    animate(
      scope.current,
      {
        y: [0, -22, 0],
        rotate: [0, -12, 0],
        scaleX: [1.15, 0.92, 1],
        scaleY: [0.8, 1.08, 1],
      },
      { duration: 0.5, delay: index * 0.035, ease: [0.3, 1.6, 0.5, 1] },
    );
  }, [hop, index, animate, scope, flail.reduced]);

  return (
    <span
      className="absolute"
      style={{
        left: spot.left,
        top: spot.top,
        zIndex: 20 - spot.row,
        transform: `rotate(${spot.rotate.toFixed(0)}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        flail.flail();
      }}
    >
      <span
        ref={scope}
        className="block"
        style={{ transformOrigin: "50% 100%" }}
      >
        <FlailingKong size={BEAN} flail={flail} seed={600 + (index % 5) * 37} />
      </span>
    </span>
  );
}

/** 콩 종지. 누르면 콩들이 차례로 튀어 오르고, 한 알을 누르면 그 콩만 바둥거린다 */
export function KongBowl({ count }: { count: number }) {
  const t = useTranslations("kong.bowl");
  const spots = useMemo(() => heapSpots(count), [count]);
  // 수북이 쌓이면 종지 위로 솟은 만큼 자리를 더 잡는다
  const lift = Math.max(0, ...spots.map((s) => -s.top));
  const back = useMemo(() => buildBowl(WIDTH, "back"), []);
  const front = useMemo(() => buildBowl(WIDTH, "front"), []);
  const [hop, setHop] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setHop((n) => n + 1)}
      aria-label={t("shake", { count })}
      className="relative mx-auto block cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
      style={{ width: WIDTH, height: HEIGHT + lift }}
    >
      <svg
        width={WIDTH}
        height={HEIGHT}
        className="absolute left-0 overflow-visible"
        style={{ top: lift }}
        aria-hidden="true"
      >
        <SceneNodes items={back} />
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-x-0"
        style={{ top: lift }}
      >
        {spots.map((spot, i) => (
          <HeapKong key={i} spot={spot} index={i} hop={hop} />
        ))}
      </span>
      <svg
        width={WIDTH}
        height={HEIGHT}
        className="pointer-events-none absolute left-0 z-30 overflow-visible"
        style={{ top: lift }}
        aria-hidden="true"
      >
        <SceneNodes items={front} />
      </svg>
    </button>
  );
}
