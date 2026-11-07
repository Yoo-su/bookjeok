"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

import { drawWalkingCat } from "../../../lib/draw";
import { pickStopCenter, type Span } from "../../../lib/free-gap";
import type { CameoSceneProps } from "../types";
import { useSpriteReady } from "../use-sprite-ready";
import {
  cycleMs,
  WALK_CROP as CROP,
  WALK_SPRITE,
  walkKeyframes,
  type WalkSprite,
} from "./walk-sprite";

/** 빈 틈에 멈춰 서 있는 시간(ms). 옆모습 그대로 눈을 깜빡인다 */
const STOP_MS = 2600;
/** 고양이가 천천히 눈을 감았다 뜨는 건 "편하다"는 인사다 */
const BLINK_AT = 620;
const BLINK = [360, 280, 380] as const;
/** 천천히 깜빡인 뒤 한 번 더 짧게 깜빡인다(ms: 시작, 감기, 감은 채, 뜨기) */
const QUICK_BLINK = [1950, 70, 50, 90] as const;
/** 눈꺼풀 색. 정지 프레임 눈 둘레 털 색 */
const LID = "#1F1C1A";
/** 들어와 멈출 때까지, 다시 걸어 나갈 때의 이동 easing */
const APPROACH = "cubic-bezier(.3,0,.55,1)";
const LEAVE = "cubic-bezier(.45,0,.7,1)";
/** 누르면 걷던 자리에서 점점 빨라지며 내달린다. 다리도 같은 easing으로 빨라진다 */
const RUN = "cubic-bezier(.4,0,1,1)";
/** 달아나는 평균 속도(px/s) 범위와, 다리가 한 바퀴 도는 평균 횟수(초당) */
const RUN_SPEED = [180, 320] as const;
const RUN_CADENCE = 3.5;
/** 들켰을 때: 움찔 → 부르르 → 내달림(ms) */
const CAUGHT = { flinch: 55, settle: 190, run: 420 } as const;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** 알약 안에서 로고·메뉴·버튼이 차지한 가로 구간(px, 알약 왼쪽 기준) */
function takenSpans(host: HTMLElement): Span[] {
  const left = host.getBoundingClientRect().left;
  return [
    ...host.querySelectorAll<HTMLElement>(
      "a, button, input, img, nav, [role='button'], .animate-pulse",
    ),
  ]
    .filter((el) => !el.closest("[data-cat-cameo]"))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r): Span => [r.left - left, r.right - left]);
}

/** 상단바 알약 안쪽 바닥을 걸어 지나가는 고양이. 가운데쯤에서 멈춰 이쪽을 본다 */
export function HeaderWalk({
  host,
  rand,
  onDone,
  sprite = WALK_SPRITE,
}: CameoSceneProps & { sprite?: WalkSprite }) {
  const size = useMemo(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    return { w, h, k: clamp(h * 0.0072, 0.3, 0.5) };
  }, [host]);
  const cat = useMemo(() => drawWalkingCat(size.k), [size.k]);
  const plan = useMemo(() => {
    const dir = rand() < 0.5 ? 1 : -1;
    const speed = clamp(size.w / 5.5, 70, 140);
    const off = -cat.width - 4;
    const start = dir > 0 ? off : size.w + 4;
    const end = dir > 0 ? size.w + 4 : off;
    return { dir, start, end, speed };
  }, [rand, size.w, cat.width]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const flinchRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<SVGImageElement>(null);
  const lidRef = useRef<SVGEllipseElement>(null);
  const lidLineRef = useRef<SVGPathElement>(null);
  const fled = useRef(false);
  const anims = useRef<Animation[]>([]);
  const ready = useSpriteReady(sprite.image, onDone);
  const spriteScale = cat.groundY / (CROP.ground - CROP.y);
  const spriteWidth = CROP.width * spriteScale;
  /** 한 걸음(다리 한 바퀴) 시간(ms) */
  const cycle = cycleMs(sprite);
  /** 한 걸음에 나아가는 거리(px). 정해져 있으면 이동을 걸음에 맞춘다 */
  const strideLength = sprite.stride && sprite.stride * spriteScale;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!ready || !wrap) return;
    // 고양이는 아직 알약 밖이다. 상단바가 자리 잡은 뒤(로그인 버튼·검색 아이콘 등) 멈출 틈을 잰다
    const id = window.setTimeout(() => {
      anims.current = walk(wrap);
    }, 250);
    return () => {
      window.clearTimeout(id);
      anims.current.forEach((a) => a.cancel());
    };
  }, [ready, plan, cat, onDone, sprite]);

  function walk(wrap: HTMLDivElement): Animation[] {
    const { start, end, speed } = plan;
    // 멈춰 서는 동안은 로고·메뉴·버튼을 가리지 않게 빈 틈에 선다. 꼬리·수염은 조금 걸쳐도 된다
    // 수염·꼬리까지 들어가는 틈을 먼저 찾고, 없으면 몸통만 들어가는 틈을 찾는다
    const taken = takenSpans(host);
    const fit = (need: number) =>
      pickStopCenter({
        width: size.w,
        taken,
        need,
        margin: size.h / 2,
        rand,
      });
    const center =
      fit(cat.width + 8) ??
      fit(cat.width * 0.72) ??
      (0.3 + rand() * 0.4) * size.w;
    const stop = center - cat.width / 2;
    const steps = (d: number) =>
      Math.max(
        2,
        Math.round(Math.abs(d) / (strideLength || (speed * cycle) / 1000)),
      );
    const n1 = steps(stop - start);
    const n2 = steps(end - stop);
    const t1 = n1 * cycle;
    const t2 = n2 * cycle;
    const total = t1 + STOP_MS + t2;
    const at = (ms: number) => ms / total;
    const list: Animation[] = [];
    const x = (v: number) => `translateX(${v.toFixed(1)}px)`;
    list.push(
      wrap.animate(
        [
          { offset: 0, transform: x(start), easing: APPROACH },
          { offset: at(t1), transform: x(stop) },
          { offset: at(t1 + STOP_MS), transform: x(stop), easing: LEAVE },
          { offset: 1, transform: x(end) },
        ],
        { duration: total, fill: "both" },
      ),
    );
    // 보폭이 정해진 그림은 다리도 이동과 같은 easing으로 돌려 디딘 발을 땅에 붙인다
    if (stripRef.current)
      list.push(
        stripRef.current.animate(walkKeyframes(sprite, n1), {
          duration: t1,
          easing: strideLength ? APPROACH : "linear",
        }),
        stripRef.current.animate(walkKeyframes(sprite, n2), {
          duration: t2,
          delay: t1 + STOP_MS,
          easing: strideLength ? LEAVE : "linear",
        }),
      );
    // 옆모습 그대로 서서 눈을 깜빡인다: 털색 눈꺼풀이 위에서 내려와 덮고, 다 감으면 감은 눈 선이 보인다
    if (sprite.restEye && lidRef.current && lidLineRef.current) {
      const [close, hold, open] = BLINK;
      const [q0, qc, qh, qo] = QUICK_BLINK;
      const o = (ms: number) => ms / STOP_MS;
      const lid = (ms: number, v: number, easing = "linear") => ({
        offset: o(ms),
        transform: `scaleY(${v})`,
        easing,
      });
      const timing = { duration: STOP_MS, delay: t1 };
      list.push(
        lidRef.current.animate(
          [
            lid(0, 0),
            lid(BLINK_AT, 0, "ease-in"),
            lid(BLINK_AT + close, 1),
            lid(BLINK_AT + close + hold, 1, "ease-out"),
            lid(BLINK_AT + close + hold + open, 0),
            lid(q0, 0, "ease-in"),
            lid(q0 + qc, 1),
            lid(q0 + qc + qh, 1, "ease-out"),
            lid(q0 + qc + qh + qo, 0),
            lid(STOP_MS, 0),
          ],
          timing,
        ),
        lidLineRef.current.animate(
          [
            { offset: 0, opacity: 0 },
            { offset: o(BLINK_AT + close - 30), opacity: 0 },
            { offset: o(BLINK_AT + close), opacity: 1 },
            { offset: o(BLINK_AT + close + hold), opacity: 1 },
            { offset: o(BLINK_AT + close + hold + 60), opacity: 0 },
            { offset: 1, opacity: 0 },
          ],
          timing,
        ),
      );
    }
    list[0].onfinish = () => {
      if (!fled.current) onDone();
    };
    return list;
  }

  /** 누르면 들킨 듯 이쪽을 보며 움찔하고, 돌아서 하던 방향으로 후다닥 내달린다. 뛰어오르지 않는다 */
  const flee = () => {
    const wrap = wrapRef.current;
    if (fled.current || !wrap) return;
    fled.current = true;
    const now = new DOMMatrixReadOnly(getComputedStyle(wrap).transform).m41;
    anims.current.forEach((a) => a.cancel());
    const end = plan.dir > 0 ? size.w + 4 : -cat.width - 4;
    const back = now - plan.dir * 3;
    const dist = Math.abs(end - back);
    // 멀수록 빠르게. 데스크톱 끝에서 끝도 3초 남짓
    const speed = clamp(dist / 1.8, ...RUN_SPEED);
    const duration = Math.max(450, (dist / speed) * 1000);
    const total = CAUGHT.run + duration;
    const at = (ms: number) => ms / total;
    const timing = { duration: total, fill: "both" } as const;
    const x = (v: number) => `translateX(${v.toFixed(1)}px)`;
    // 놀라 살짝 물러섰다가, 굳은 자리에서 점점 빨라지며 내달린다
    const run = wrap.animate(
      [
        { offset: 0, transform: x(now), easing: "ease-out" },
        { offset: at(CAUGHT.flinch), transform: x(back) },
        { offset: at(CAUGHT.run), transform: x(back), easing: RUN },
        { offset: 1, transform: x(end) },
      ],
      timing,
    );
    const list = [run];
    // 움찔: 발밑을 기준으로 납작해졌다가 돌아오고, 부르르 떤다
    const shake = (dx: number, sx = 1, sy = 1) =>
      `translateX(${dx}px) scale(${sx}, ${sy})`;
    if (flinchRef.current)
      list.push(
        flinchRef.current.animate(
          [
            { offset: 0, transform: shake(0) },
            { offset: at(CAUGHT.flinch), transform: shake(0, 1.08, 0.84) },
            { offset: at(120), transform: shake(0, 0.98, 1.03) },
            { offset: at(CAUGHT.settle), transform: shake(0) },
            { offset: at(225), transform: shake(-0.8) },
            { offset: at(260), transform: shake(0.8) },
            { offset: at(295), transform: shake(-0.5) },
            { offset: at(330), transform: shake(0) },
            { offset: 1, transform: shake(0) },
          ],
          timing,
        ),
      );
    if (stripRef.current)
      list.push(
        stripRef.current.animate(
          walkKeyframes(
            sprite,
            Math.max(2, Math.round((duration / 1000) * RUN_CADENCE)),
          ),
          { duration, delay: CAUGHT.run, easing: RUN },
        ),
      );
    anims.current = list;
    run.onfinish = () => onDone();
  };

  return createPortal(
    <div
      aria-hidden
      data-cat-cameo
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <div
        ref={wrapRef}
        className="absolute left-0"
        style={{
          top: size.h - 4 - cat.groundY,
          width: cat.width,
          height: cat.height,
          transform: `translateX(${plan.start}px)`,
        }}
      >
        <div
          ref={flinchRef}
          style={{ transformOrigin: `${cat.width / 2}px ${cat.groundY}px` }}
        >
          <svg
            width={cat.width}
            height={cat.height}
            overflow="visible"
            style={plan.dir < 0 ? { transform: "scaleX(-1)" } : undefined}
          >
            <svg
              x={(cat.width - spriteWidth) / 2}
              width={spriteWidth}
              height={CROP.height * spriteScale}
              viewBox={`${CROP.x} ${CROP.y} ${CROP.width} ${CROP.height}`}
              overflow="hidden"
            >
              <g>
                <image
                  ref={stripRef}
                  href={sprite.image}
                  width={sprite.sheetWidth}
                  height={sprite.sheetHeight}
                  style={{
                    transform: `translateX(${-sprite.frames[sprite.restFrame].x}px)`,
                  }}
                />
              </g>
              {sprite.restEye && (
                <g>
                  <ellipse
                    ref={lidRef}
                    cx={sprite.restEye.cx}
                    cy={sprite.restEye.cy}
                    rx={sprite.restEye.rx}
                    ry={sprite.restEye.ry}
                    fill={LID}
                    style={{
                      transform: "scaleY(0)",
                      transformBox: "fill-box",
                      transformOrigin: "50% 0%",
                    }}
                  />
                  <path
                    ref={lidLineRef}
                    d={`M${sprite.restEye.cx - 5} ${sprite.restEye.cy + 1.2}Q${sprite.restEye.cx} ${sprite.restEye.cy + 4.2} ${sprite.restEye.cx + 5} ${sprite.restEye.cy + 1.2}`}
                    fill="none"
                    stroke="#E8D0A8"
                    strokeWidth={1}
                    strokeLinecap="round"
                    opacity={0}
                  />
                </g>
              )}
              <path
                d="M25 60 Q21 103 51 104 Q54 114 55 143 H139 L145 106 Q173 101 173 77 Q170 64 155 56 L146 30 L127 51 L112 35 L101 69 Q77 63 55 78 Q38 82 35 56Z"
                fill="transparent"
                pointerEvents="visibleFill"
                className="cursor-pointer"
                onPointerDown={flee}
              />
            </svg>
          </svg>
        </div>
      </div>
    </div>,
    host,
  );
}
