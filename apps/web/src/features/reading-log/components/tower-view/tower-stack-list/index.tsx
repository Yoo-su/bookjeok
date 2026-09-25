"use client";

import { inkColorFor, type ReadingTowerBook } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

import { cm1 } from "../hooks/use-tower-copy";
import { bookColor } from "../lib/scene";
import { hashSeed, rng } from "../lib/sketch";

interface TowerStackListProps {
  books: ReadingTowerBook[];
  onBookClick: (book: ReadingTowerBook) => void;
}

/** 제목을 읽을 수 있도록 두께를 이만큼 과장한다(무대와 공유 이미지는 실제 비율) */
const DEPTH_EMPHASIS = 1.3;

/**
 * 쌓인 순서. 맨 위가 가장 최근에 읽은 책이고, 월마다 지층처럼 나눈다.
 */
export const TowerStackList = forwardRef<HTMLElement, TowerStackListProps>(
  function TowerStackList({ books, onBookClick }, ref) {
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
                  const r = rng(hashSeed(`${b.isbn}:${b.logId}`));
                  const jx = (r() - 0.5) * 16;
                  const jr = (r() - 0.5) * 1.2;
                  const h = b.depth * k * DEPTH_EMPHASIS;
                  const fs = Math.max(7, Math.min(15, h * 0.5));
                  const color = bookColor(b);
                  return (
                    <button
                      key={b.logId}
                      type="button"
                      onClick={() => onBookClick(b)}
                      aria-label={`${b.title}, ${b.author}`}
                      className="relative isolate flex cursor-pointer items-center gap-2 rounded-[2px] border-[1.5px] border-stone-900 pl-3 pr-2.5 text-left transition-transform duration-200 before:absolute before:-inset-[1.5px] before:-z-10 before:translate-x-[-3px] before:translate-y-[-2px] before:rounded-[inherit] before:bg-(--c) [transform:translateX(var(--jx))_rotate(var(--jr))] pointer-fine:hover:[transform:translateX(calc(var(--jx)+10px))]"
                      style={
                        {
                          "--c": color,
                          color: inkColorFor(color),
                          width: `${(b.height * k).toFixed(1)}px`,
                          height: `${h.toFixed(1)}px`,
                          "--jx": `${jx.toFixed(1)}px`,
                          "--jr": `${jr.toFixed(2)}deg`,
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className="min-w-0 flex-1 truncate font-bold"
                        style={{ fontSize: `${fs.toFixed(1)}px` }}
                      >
                        {b.title}
                      </span>
                      {h >= 17 && (
                        <span
                          className="max-w-[38%] truncate opacity-70"
                          style={{
                            fontSize: `${Math.max(7, fs * 0.74).toFixed(1)}px`,
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
  },
);
