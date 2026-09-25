"use client";

import { inkColorFor, type ReadingTowerBook } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";

import { cm1 } from "../hooks/use-tower-copy";
import { bookColor } from "../lib/scene";
import {
  type Cmds,
  f1,
  hashSeed,
  poly,
  type Pt,
  rng,
  samplePath,
  wobble,
} from "../lib/sketch";

interface TowerStackListProps {
  books: ReadingTowerBook[];
  onBookClick: (book: ReadingTowerBook) => void;
}

/** 제목을 읽을 수 있도록 두께를 이만큼 과장한다(무대와 공유 이미지는 실제 비율) */
const DEPTH_EMPHASIS = 1.3;

const INK = "#1C1917";

/**
 * 무대 미니어처와 같은 손그림 책. 색면을 윤곽에서 어긋나게 찍고(리소 인쇄 느낌),
 * 윤곽선은 캐릭터처럼 진한 선과 흐린 선을 겹쳐 흔들고, 책등 양끝에 띠를 긋는다.
 */
function SketchBook({
  w,
  h,
  color,
  seed,
}: {
  w: number;
  h: number;
  color: string;
  seed: number;
}) {
  const d = useMemo(() => {
    const [x0, y0, x1, y1] = [1.5, 1.5, w - 1.5, h - 1.5];
    const rect: Cmds = [
      "M",
      x0,
      y0,
      "L",
      x1,
      y0,
      "L",
      x1,
      y1,
      "L",
      x0,
      y1,
      "L",
      x0,
      y0,
    ];
    const pts = samplePath(rect, (x, y): Pt => [x, y]);
    const band = (t: number): Cmds => {
      const x = x0 + (x1 - x0) * t;
      return ["M", x, y0 + (y1 - y0) * 0.22, "L", x, y0 + (y1 - y0) * 0.78];
    };
    return {
      fill: poly(
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ].map(([x, y]): Pt => [x - 3, y - 2]),
      ),
      ink: wobble(pts, seed, Math.min(1.3, h * 0.08), true),
      pencil: wobble(pts, seed + 1, Math.min(2.2, h * 0.12), true),
      bands:
        h >= 12
          ? [0.07, 0.93]
              .map((t, i) =>
                wobble(
                  samplePath(band(t), (x, y): Pt => [x, y]),
                  seed + 2 + i,
                  0.6,
                  false,
                ),
              )
              .join(" ")
          : "",
    };
  }, [w, h, seed]);

  return (
    <svg
      aria-hidden="true"
      width={w}
      height={h}
      viewBox={`0 0 ${f1(w)} ${f1(h)}`}
      className="pointer-events-none absolute inset-0 -z-10 overflow-visible"
    >
      <path d={d.fill} fill={color} />
      <path
        d={d.ink}
        fill="none"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      />
      <path
        d={d.pencil}
        fill="none"
        stroke={INK}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.35}
      />
      {d.bands && (
        <path
          d={d.bands}
          fill="none"
          stroke={INK}
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.55}
        />
      )}
    </svg>
  );
}

/**
 * 쌓인 순서. 맨 위가 가장 최근에 읽은 책이고, 월마다 지층처럼 나눈다.
 * 인트로 동안 부모가 권수를 올리며 자주 다시 그려져 memo로 막는다.
 */
export const TowerStackList = memo(
  forwardRef<HTMLElement, TowerStackListProps>(function TowerStackList(
    { books, onBookClick },
    ref,
  ) {
    const t = useTranslations("reading_log.tower");
    const colRef = useRef<HTMLDivElement>(null);
    const [colWidth, setColWidth] = useState(0);

    useEffect(() => {
      const el = colRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => setColWidth(el.clientWidth));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const layers = useMemo(() => {
      const groups: {
        key: string;
        month: number;
        books: ReadingTowerBook[];
      }[] = [];
      [...books].reverse().forEach((b) => {
        const key = b.date.slice(0, 7);
        const last = groups[groups.length - 1];
        if (last?.key === key) last.books.push(b);
        else
          groups.push({ key, month: Number(b.date.slice(5, 7)), books: [b] });
      });
      return groups;
    }, [books]);

    const maxHeight = Math.max(210, ...books.map((b) => b.height));
    const k = colWidth ? Math.min(1.45, (colWidth - 34) / maxHeight) : 1;

    return (
      <section ref={ref} className="grid scroll-mt-24 gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-serif text-[22px] font-semibold tracking-tight text-stone-900">
            {t("stack_title")}
          </h3>
          <span className="text-[12.5px] text-stone-500">
            {t("stack_hint")}
          </span>
        </div>
        <div>
          {layers.map((layer, li) => (
            <div
              key={layer.key}
              className="grid grid-cols-[58px_minmax(0,1fr)]"
            >
              <div className="grid content-start pt-2">
                <b className="font-[family-name:var(--font-gaegu)] text-2xl leading-none text-stone-900">
                  {t("layer_month", { month: layer.month })}
                </b>
                <span className="mt-1 font-[family-name:var(--font-gaegu)] text-[13px] font-bold leading-tight text-stone-400">
                  {t("layer_count", { count: layer.books.length })}
                  <br />
                  {cm1(layer.books.reduce((acc, b) => acc + b.depth, 0))}cm
                </span>
              </div>
              <div
                ref={li === 0 ? colRef : undefined}
                className="flex flex-col items-center gap-px bg-[linear-gradient(90deg,#d6d3d1_50%,transparent_50%)] bg-[length:8px_1px] bg-repeat-x pb-1.5 pt-2.5"
              >
                {layer.books.map((b) => {
                  const seed = hashSeed(`${b.isbn}:${b.logId}`);
                  const r = rng(seed);
                  const jx = (r() - 0.5) * 16;
                  const jr = (r() - 0.5) * 1.2;
                  const w = b.height * k;
                  const h = b.depth * k * DEPTH_EMPHASIS;
                  // 손글씨는 글자가 작게 보여 본문 글꼴보다 키운다
                  const fs = Math.max(9, Math.min(19, h * 0.6));
                  const color = bookColor(b);
                  // 책등 띠 안쪽에 글자를 둔다
                  const pad = `${Math.max(10, w * 0.1).toFixed(1)}px`;
                  return (
                    <button
                      key={b.logId}
                      type="button"
                      onClick={() => onBookClick(b)}
                      aria-label={`${b.title}, ${b.author}`}
                      className="relative isolate flex cursor-pointer items-center gap-2 rounded-[2px] text-left font-[family-name:var(--font-gaegu)] font-bold transition-transform duration-200 [transform:translateX(var(--jx))_rotate(var(--jr))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 pointer-fine:hover:[transform:translateX(calc(var(--jx)+10px))]"
                      style={
                        {
                          color: inkColorFor(color),
                          width: `${w.toFixed(1)}px`,
                          height: `${h.toFixed(1)}px`,
                          paddingLeft: pad,
                          paddingRight: pad,
                          "--jx": `${jx.toFixed(1)}px`,
                          "--jr": `${jr.toFixed(2)}deg`,
                        } as React.CSSProperties
                      }
                    >
                      <SketchBook w={w} h={h} color={color} seed={seed} />
                      {/* 얇은 책은 미니어처처럼 제목 없이 색 띠만 */}
                      {h >= 11 && (
                        <span
                          className="min-w-0 flex-1 truncate leading-none"
                          style={{ fontSize: `${fs.toFixed(1)}px` }}
                        >
                          {b.title}
                        </span>
                      )}
                      {h >= 20 && (
                        <span
                          className="max-w-[38%] truncate leading-none opacity-70"
                          style={{
                            fontSize: `${Math.max(9, fs * 0.8).toFixed(1)}px`,
                          }}
                        >
                          {b.author}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }),
);
