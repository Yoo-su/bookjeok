"use client";

import {
  type AnimationPlaybackControls,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { SceneNodes } from "../../stack-view/lib/scene-svg";
import { rng } from "../../stack-view/lib/sketch";
import { useKongFlail } from "../hooks/use-kong-flail";
import { FlailingKong } from "../kong-figure/flailing-kong";
import {
  BOWL_ASPECT,
  BOWL_RIM_Y,
  buildBowl,
  type KongFace,
} from "../lib/kong-art";

const WIDTH = 240;
const HEIGHT = WIDTH * BOWL_ASPECT;
const BEAN = 38;
/** 종지에 그리는 최대 알 수. 넘으면 숫자로만 */
export const KONG_BOWL_MAX_DRAWN = 30;
/** 아래 줄부터 한 줄에 담는 알 수 */
const ROW_CAPS = [7, 6, 5, 4, 3, 2, 2, 1];
/** 엎은 종지 앞 바닥. 콩 발이 닿는 깊이 범위(px)와 그만큼 아래로 더 잡는 자리 */
const FLOOR_BAND = 18;
const FLOOR_PAD = 24;
/** 종지를 뒤집는 축(그림 높이 비율)과, 뒤집은 뒤 입구가 바닥에 닿게 내리는 거리 */
const FLIP_ORIGIN = "50% 63%";
const FLIP_DROP = 22;
const TIP_S = 0.7;
const UPRIGHT_S = 0.55;
/** 다시 담을 때 종지가 선 뒤 콩이 한 알씩 뛰어드는 간격 */
const REFILL_DELAY_S = UPRIGHT_S - 0.1;
const REFILL_STAGGER_S = 0.035;
const REFILL_HOP_S = 0.5;

type Phase = "heap" | "spilling" | "spilled" | "refilling";

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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function HeapKong({
  spot,
  index,
  hop,
  lift,
  out,
  containerRef,
}: {
  spot: HeapSpot;
  index: number;
  hop: number;
  lift: number;
  /** 종지를 엎어 바닥에 나와 있는지 */
  out: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const flail = useKongFlail();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const hopRef = useRef<HTMLSpanElement>(null);
  const bobRef = useRef<HTMLSpanElement>(null);
  const homeZ = 20 - spot.row;
  const [z, setZ] = useState(homeZ);
  const [walkFrame, setWalkFrame] = useState<0 | 1 | null>(null);
  // 허둥대며 눈을 질끈 감고 다니는 콩과 웃으며 다니는 콩
  const [mood] = useState<KongFace>(() =>
    Math.random() < 0.5 ? "squeeze" : "smile",
  );
  const wasOut = useRef(false);
  const { reduced, play } = flail;

  // 종지를 누르면 차례로 튀어 오른다
  useEffect(() => {
    if (!hop || reduced || !hopRef.current) return;
    animate(
      hopRef.current,
      {
        y: [0, -22, 0],
        rotate: [0, -12, 0],
        scaleX: [1.15, 0.92, 1],
        scaleY: [0.8, 1.08, 1],
      },
      { duration: 0.5, delay: index * 0.035, ease: [0.3, 1.6, 0.5, 1] },
    );
  }, [hop, index, animate, reduced]);

  // 엎으면 바닥으로 흩어져 돌아다니고, 다시 담으면 제자리로 뛰어든다
  useEffect(() => {
    const el = scope.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const homeX = () => (container.clientWidth - WIDTH) / 2 + spot.left;
    const homeY = lift + spot.top;

    if (!out) {
      if (!wasOut.current) return;
      wasOut.current = false;
      setWalkFrame(null);
      setZ(50);
      const back = animate(
        el,
        {
          x: reduced ? 0 : [null, 0],
          y: reduced ? 0 : [null, -60, 0],
          rotate: spot.rotate,
        },
        {
          duration: reduced ? 0 : REFILL_HOP_S,
          delay: reduced ? 0 : REFILL_DELAY_S + index * REFILL_STAGGER_S,
          ease: "easeOut",
        },
      );
      back.then(() => setZ(homeZ));
      return () => back.stop();
    }

    wasOut.current = true;
    let cancelled = false;
    let walkTimer: ReturnType<typeof setInterval> | undefined;
    let running: AnimationPlaybackControls | undefined;
    let bob: AnimationPlaybackControls | undefined;
    const run = (c: AnimationPlaybackControls) => {
      running = c;
      return c;
    };
    const floorY = (depth: number) =>
      lift + HEIGHT - BEAN + 2 + depth * FLOOR_BAND;
    const randomFloor = () => {
      const depth = Math.random();
      const x =
        4 + Math.random() * Math.max(0, container.clientWidth - BEAN - 8);
      return { x: x - homeX(), y: floorY(depth) - homeY, depth };
    };
    const startWalk = () => {
      setWalkFrame(0);
      walkTimer = setInterval(
        () => setWalkFrame((f) => (f === 0 ? 1 : 0)),
        110,
      );
      if (bobRef.current)
        bob = animate(
          bobRef.current,
          { y: [0, -3, 0] },
          { duration: 0.22, repeat: Infinity },
        );
    };
    const stopWalk = () => {
      clearInterval(walkTimer);
      bob?.stop();
      if (bobRef.current) animate(bobRef.current, { y: 0 }, { duration: 0.1 });
      setWalkFrame(null);
    };

    (async () => {
      // 종지가 기울어 넘어가는 동안 쏟아져 포물선으로 떨어진다
      const land = randomFloor();
      const spin = (Math.random() < 0.5 ? -1 : 1) * 360;
      setZ(50);
      await run(
        animate(
          el,
          reduced
            ? { x: land.x, y: land.y, rotate: 0 }
            : {
                x: [0, land.x * 0.5, land.x],
                y: [
                  0,
                  Math.min(0, land.y) * 0.5 - 40 - Math.random() * 40,
                  land.y,
                ],
                rotate: [spot.rotate, spot.rotate + spin * 0.5, spin],
              },
          reduced
            ? { duration: 0 }
            : {
                duration: 0.6 + Math.random() * 0.2,
                delay: 0.12 + Math.random() * 0.22,
                times: [0, 0.4, 1],
                ease: ["easeOut", "easeIn"],
              },
        ),
      );
      if (cancelled) return;
      // 엎은 종지보다 앞, 깊을수록 앞에 그린다
      setZ(40 + Math.round(land.depth * 10));
      if (reduced) return;
      // 떨어지자마자 놀라 부르르 떨거나 바둥거린다
      play(Math.random() < 0.5 ? "shiver" : "flail");
      await wait(500 + Math.random() * 700);

      while (!cancelled) {
        if (Math.random() < 0.18) {
          play(Math.random() < 0.5 ? "hop" : "shiver");
          await wait(800 + Math.random() * 600);
          continue;
        }
        const to = randomFloor();
        const from = { x: Number(el.dataset.x ?? land.x), y: 0 };
        const dist = Math.abs(to.x - from.x) + 30;
        const dir = to.x >= from.x ? 1 : -1;
        startWalk();
        await run(
          animate(
            el,
            { x: to.x, y: to.y, rotate: dir * 8 },
            {
              duration: Math.min(
                2.2,
                Math.max(0.45, dist / (70 + Math.random() * 60)),
              ),
              ease: "easeInOut",
            },
          ),
        );
        el.dataset.x = String(to.x);
        stopWalk();
        if (cancelled) return;
        setZ(40 + Math.round(to.depth * 10));
        animate(el, { rotate: 0 }, { duration: 0.2 });
        await wait(250 + Math.random() * 1300);
      }
    })();

    return () => {
      cancelled = true;
      running?.stop();
      stopWalk();
      delete el.dataset.x;
    };
  }, [
    out,
    lift,
    index,
    homeZ,
    spot,
    reduced,
    play,
    animate,
    scope,
    containerRef,
  ]);

  return (
    <span
      ref={scope}
      className="absolute"
      style={{
        left: `calc(50% - ${WIDTH / 2}px + ${spot.left}px)`,
        top: lift + spot.top,
        zIndex: z,
        transform: `rotate(${spot.rotate.toFixed(0)}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        flail.poke();
      }}
    >
      <span ref={bobRef} className="block">
        <span
          ref={hopRef}
          className="block"
          style={{ transformOrigin: "50% 100%" }}
        >
          <FlailingKong
            size={BEAN}
            flail={flail}
            seed={600 + (index % 5) * 37}
            restFace={walkFrame === null ? "smile" : mood}
            restLimbs={
              walkFrame === null ? "none" : walkFrame ? "flail1" : "flail0"
            }
          />
        </span>
      </span>
    </span>
  );
}

/**
 * 콩 종지. 누르면 콩들이 차례로 튀어 오르고, 한 알을 누르면 그 콩만 반응한다.
 * 「종지 엎기」로 뒤집으면 콩이 바닥으로 쏟아져 우왕좌왕 돌아다니고, 「다시 담기」로 돌아온다
 */
export function KongBowl({ count }: { count: number }) {
  const t = useTranslations("kong.bowl");
  const reduced = useReducedMotion();
  const spots = useMemo(() => heapSpots(count), [count]);
  // 수북이 쌓이면 종지 위로 솟은 만큼 자리를 더 잡는다
  const lift = Math.max(0, ...spots.map((s) => -s.top));
  const back = useMemo(() => buildBowl(WIDTH, "back"), []);
  const front = useMemo(() => buildBowl(WIDTH, "front"), []);
  const [hop, setHop] = useState(0);
  const [phase, setPhase] = useState<Phase>("heap");
  const containerRef = useRef<HTMLDivElement>(null);
  const [bowlScope, animateBowl] = useAnimate<HTMLButtonElement>();
  const phaseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const out = phase === "spilling" || phase === "spilled";

  useEffect(() => () => clearTimeout(phaseTimer.current), []);

  const tip = () => {
    setPhase("spilling");
    animateBowl(
      ".kong-bowl-art",
      reduced
        ? { rotate: 180, y: FLIP_DROP }
        : { rotate: [0, 70, 180], y: [0, -28, FLIP_DROP] },
      reduced
        ? { duration: 0 }
        : { duration: TIP_S, times: [0, 0.35, 1], ease: ["easeOut", "easeIn"] },
    );
    phaseTimer.current = setTimeout(
      () => setPhase("spilled"),
      reduced ? 0 : 1100,
    );
  };

  const refill = () => {
    setPhase("refilling");
    animateBowl(
      ".kong-bowl-art",
      reduced
        ? { rotate: 0, y: 0 }
        : { rotate: [180, 110, 0], y: [FLIP_DROP, -28, 0] },
      reduced
        ? { duration: 0 }
        : {
            duration: UPRIGHT_S,
            times: [0, 0.45, 1],
            ease: ["easeOut", "easeOut"],
          },
    );
    const settle =
      REFILL_DELAY_S + spots.length * REFILL_STAGGER_S + REFILL_HOP_S;
    phaseTimer.current = setTimeout(
      () => setPhase("heap"),
      reduced ? 0 : settle * 1000,
    );
  };

  const artStyle = { top: lift, transformOrigin: FLIP_ORIGIN };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: HEIGHT + lift + FLOOR_PAD }}
      >
        <button
          ref={bowlScope}
          type="button"
          onClick={() => phase === "heap" && setHop((n) => n + 1)}
          aria-label={t("shake", { count })}
          aria-disabled={phase !== "heap"}
          // transform으로 가운데를 잡으면 쌓임 맥락이 생겨 콩이 종지 몸통 앞으로 나온다
          className="absolute top-0 block cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-stone-700 aria-disabled:cursor-default"
          style={{
            left: `calc(50% - ${WIDTH / 2}px)`,
            width: WIDTH,
            height: HEIGHT + lift,
          }}
        >
          <svg
            width={WIDTH}
            height={HEIGHT}
            // 뒤집으면 그림 상자가 아래로 삐져나와 「다시 담기」를 덮는다. 누르기는 종지 버튼이 받는다
            className="kong-bowl-art pointer-events-none absolute left-0 overflow-visible"
            style={artStyle}
            aria-hidden="true"
          >
            <SceneNodes items={back} />
          </svg>
          <svg
            width={WIDTH}
            height={HEIGHT}
            className="kong-bowl-art pointer-events-none absolute left-0 z-30 overflow-visible"
            style={artStyle}
            aria-hidden="true"
          >
            <SceneNodes items={front} />
          </svg>
        </button>
        <span aria-hidden="true">
          {spots.map((spot, i) => (
            <HeapKong
              key={i}
              spot={spot}
              index={i}
              hop={hop}
              lift={lift}
              out={out}
              containerRef={containerRef}
            />
          ))}
        </span>
      </div>
      <p className="mt-1 flex items-center justify-center gap-3 font-[family-name:var(--font-gaegu)] text-base text-stone-400">
        {t("hint")}
        <button
          type="button"
          onClick={phase === "heap" ? tip : refill}
          disabled={phase === "spilling" || phase === "refilling"}
          className="cursor-pointer text-stone-500 underline decoration-dotted underline-offset-4 hover:text-stone-800 disabled:cursor-default disabled:opacity-50"
        >
          {phase === "heap" ? t("tip") : t("refill")}
        </button>
      </p>
    </div>
  );
}
