"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

import { drawWalkingCat } from "../../../lib/draw";
import { pickStopCenter, type Span } from "../../../lib/free-gap";
import { CatPart } from "../cat-part";
import type { CameoSceneProps } from "../types";

/** 멈춰 서서 이쪽을 보는 시간(ms). 고개 돌리기 → 천천히 눈 감았다 뜨기 → 다시 앞 */
const STOP_MS = 2600;
const TURN_IN = 160;
const TURN_OUT = 2150;
/** 고양이가 천천히 눈을 감았다 뜨는 건 "편하다"는 인사다 */
const BLINK_AT = 620;
const BLINK = [360, 280, 380] as const;
/** 한 걸음(다리 한 바퀴) 시간(ms) */
const STRIDE = 520;

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
export function HeaderWalk({ host, rand, onDone }: CameoSceneProps) {
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
  const legRefs = useRef<(SVGGElement | null)[]>([]);
  const tailRef = useRef<SVGGElement>(null);
  const profileRef = useRef<SVGGElement>(null);
  const frontRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const fled = useRef(false);
  const anims = useRef<Animation[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let list: Animation[] = [];
    // 고양이는 아직 알약 밖이다. 상단바가 자리 잡은 뒤(로그인 버튼·검색 아이콘 등) 멈출 틈을 잰다
    const id = window.setTimeout(() => {
      list = walk(wrap);
      anims.current = list;
    }, 250);
    return () => {
      window.clearTimeout(id);
      list.forEach((a) => a.cancel());
    };
  }, [plan, cat, onDone]);

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
      Math.max(2, Math.round(Math.abs(d) / speed / (STRIDE / 1000)));
    const n1 = steps(stop - start);
    const n2 = steps(end - stop);
    const t1 = n1 * STRIDE;
    const t2 = n2 * STRIDE;
    const total = t1 + STOP_MS + t2;
    const at = (ms: number) => ms / total;
    const list: Animation[] = [];
    const x = (v: number) => `translateX(${v.toFixed(1)}px)`;
    list.push(
      wrap.animate(
        [
          {
            offset: 0,
            transform: x(start),
            easing: "cubic-bezier(.3,0,.55,1)",
          },
          { offset: at(t1), transform: x(stop) },
          {
            offset: at(t1 + STOP_MS),
            transform: x(stop),
            easing: "cubic-bezier(.45,0,.7,1)",
          },
          { offset: 1, transform: x(end) },
        ],
        { duration: total, fill: "both" },
      ),
    );
    // 대각선 두 쌍이 번갈아 딛는다. 멈출 때 한 쌍은 땅을 딛고 있다
    // 0·2가 뒷다리. 허벅지가 엉덩이 밖으로 덜 나가게 덜 벌린다
    legRefs.current.forEach((el, i) => {
      if (!el) return;
      const phase = i === 0 || i === 3 ? 0 : 0.5;
      const step = stepFrames(i % 2 ? cat.swing : cat.hindSwing, cat.lift);
      list.push(
        el.animate(step, {
          duration: STRIDE,
          iterations: n1,
          iterationStart: phase,
        }),
        el.animate(step, {
          duration: STRIDE,
          iterations: n2,
          iterationStart: phase,
          delay: t1 + STOP_MS,
        }),
      );
    });
    if (tailRef.current)
      list.push(
        tailRef.current.animate(
          [
            { transform: "rotate(0deg)" },
            { transform: "rotate(-7deg)" },
            { transform: "rotate(3deg)" },
            { transform: "rotate(0deg)" },
          ],
          { duration: 1700, iterations: Infinity, easing: "ease-in-out" },
        ),
      );
    // 고개 돌리기는 그림을 바꿔 끼운다. 사이를 짧게 겹쳐 툭 끊기지 않게
    const turn = (show: boolean): Keyframe[] => {
      const a = show ? 0 : 1;
      const b = show ? 1 : 0;
      return [
        { offset: 0, opacity: a },
        { offset: at(t1 + TURN_IN), opacity: a },
        { offset: at(t1 + TURN_IN + 70), opacity: b },
        { offset: at(t1 + TURN_OUT), opacity: b },
        { offset: at(t1 + TURN_OUT + 70), opacity: a },
        { offset: 1, opacity: a },
      ];
    };
    if (frontRef.current)
      list.push(
        frontRef.current.animate(turn(true), { duration: total, fill: "both" }),
      );
    if (profileRef.current)
      list.push(
        profileRef.current.animate(turn(false), {
          duration: total,
          fill: "both",
        }),
      );
    if (eyesRef.current) {
      const [close, hold, open] = BLINK;
      const b0 = t1 + BLINK_AT;
      list.push(
        eyesRef.current.animate(
          [
            { offset: 0, transform: "scaleY(1)" },
            { offset: at(b0), transform: "scaleY(1)", easing: "ease-in" },
            { offset: at(b0 + close), transform: "scaleY(0.08)" },
            {
              offset: at(b0 + close + hold),
              transform: "scaleY(0.08)",
              easing: "ease-out",
            },
            { offset: at(b0 + close + hold + open), transform: "scaleY(1)" },
            { offset: 1, transform: "scaleY(1)" },
          ],
          { duration: total },
        ),
      );
    }
    list[0].onfinish = () => {
      if (!fled.current) onDone();
    };
    return list;
  }

  /** 누르면 깜짝 놀라 하던 방향으로 내뺀다 */
  const flee = () => {
    const wrap = wrapRef.current;
    if (fled.current || !wrap) return;
    fled.current = true;
    const now = new DOMMatrixReadOnly(getComputedStyle(wrap).transform).m41;
    anims.current.forEach((a) => a.cancel());
    const x = (v: number) => `translateX(${v.toFixed(1)}px)`;
    const run = wrap.animate(
      [
        { transform: `${x(now)} translateY(0px)` },
        {
          transform: `${x(now - plan.dir * 3)} translateY(-7px)`,
          offset: 0.22,
        },
        {
          transform: `${x(now)} translateY(0px)`,
          offset: 0.4,
          easing: "ease-in",
        },
        {
          transform: `${x(plan.dir > 0 ? size.w + 4 : -cat.width - 4)} translateY(0px)`,
        },
      ],
      { duration: 640, fill: "both" },
    );
    legRefs.current.forEach((el, i) =>
      el?.animate(
        stepFrames((i % 2 ? cat.swing : cat.hindSwing) * 1.4, cat.lift * 1.6),
        {
          duration: 190,
          iterations: Infinity,
          iterationStart: i === 0 || i === 3 ? 0 : 0.5,
          delay: 200,
        },
      ),
    );
    run.onfinish = () => onDone();
  };

  const [far1, far2] = cat.farLegs;
  const [near1, near2] = cat.nearLegs;
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
        <svg
          width={cat.width}
          height={cat.height}
          overflow="visible"
          style={plan.dir < 0 ? { transform: "scaleX(-1)" } : undefined}
        >
          <g
            className="cursor-pointer"
            pointerEvents="visiblePainted"
            onPointerDown={flee}
          >
            <CatPart ref={tailRef} part={cat.tail} />
            <CatPart ref={(el) => void (legRefs.current[0] = el)} part={far1} />
            <CatPart ref={(el) => void (legRefs.current[1] = el)} part={far2} />
            <CatPart items={cat.body} />
            <CatPart
              ref={(el) => void (legRefs.current[2] = el)}
              part={near1}
            />
            <CatPart
              ref={(el) => void (legRefs.current[3] = el)}
              part={near2}
            />
            <CatPart ref={profileRef} items={cat.profile} />
            <g ref={frontRef} style={{ opacity: 0 }}>
              <CatPart items={cat.front.face} />
              <CatPart
                ref={eyesRef}
                pivot={cat.front.eyeCenter}
                items={[...cat.front.eyes, ...cat.front.pupils]}
              />
            </g>
          </g>
        </svg>
      </div>
    </div>,
    host,
  );
}

/**
 * 다리 한 바퀴. 0은 몸 아래를 딛고 지나가는 순간, 뒤로 밀고(+), 들어 올려 앞으로(-) 내딛는다.
 * 축이 다리 위 끝이라 +각도면 발이 뒤로 간다
 */
function stepFrames(swing: number, lift: number): Keyframe[] {
  const r = (d: number) => `rotate(${d.toFixed(1)}deg)`;
  return [
    { transform: `translateY(0px) ${r(0)}` },
    { transform: `translateY(0px) ${r(swing)}` },
    { transform: `translateY(${(-lift).toFixed(2)}px) ${r(0)}` },
    { transform: `translateY(0px) ${r(-swing)}` },
    { transform: `translateY(0px) ${r(0)}` },
  ];
}
