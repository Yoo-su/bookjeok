"use client";

import { memo, useMemo } from "react";

import { cn } from "@/shared/utils/cn";

import { SceneNodes } from "../../stack-view/lib/scene-svg";
import { buildKong, type KongFace, type KongLimbs } from "../lib/kong-art";

/**
 * 같은 크기·표정·팔다리·시드의 그림은 다시 그리지 않는다. 흩어진 콩 수십 알이
 * 걸으며 팔다리 프레임을 번갈아 바꿔도 연필 선을 매번 새로 만들지 않게
 */
const cache = new Map<string, ReturnType<typeof buildKong>>();
const CACHE_MAX = 400;

function cachedKong(opts: Parameters<typeof buildKong>[0]) {
  const key = `${opts.size}|${opts.face}|${opts.limbs}|${opts.boil}|${opts.seed}`;
  let items = cache.get(key);
  if (!items) {
    if (cache.size >= CACHE_MAX) cache.clear();
    items = buildKong(opts);
    cache.set(key, items);
  }
  return items;
}

interface KongFigureProps {
  size: number;
  face?: KongFace;
  limbs?: KongLimbs;
  /** 선 떨림. 크게 그릴 때만 켠다 */
  boil?: boolean;
  /** 종지 속 콩처럼 여러 알을 그릴 때 한 알씩 다르게 */
  seed?: number;
  className?: string;
}

/** 연필로 그린 콩 한 알. 장식이라 스크린 리더에서 숨긴다 */
export const KongFigure = memo(function KongFigure({
  size,
  face = "smile",
  limbs = "none",
  boil = false,
  seed,
  className,
}: KongFigureProps) {
  const items = useMemo(
    () => cachedKong({ size, face, limbs, boil, seed }),
    [size, face, limbs, boil, seed],
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      className={cn("block shrink-0", className)}
    >
      <SceneNodes items={items} />
    </svg>
  );
});
