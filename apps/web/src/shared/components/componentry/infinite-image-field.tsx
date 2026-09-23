"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils/index";

export interface InfiniteImageItem {
  id: string | number;
  image: string;
  title?: string;
  price?: number;
  author?: string;
  city?: string;
  district?: string;
}

export const INFINITE_IMAGE_FIELD_IMAGES: string[] = [
  "https://plus.unsplash.com/premium_photo-1665311515452-a9f54c4266c9?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=560&fit=crop&q=80",
];

export interface InfiniteImageFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  className?: string;
  items?: InfiniteImageItem[];
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
  gap?: number;
  maxSpeed?: number;
  smoothing?: number;
  borderRadius?: number;
  onItemClick?: (item: InfiniteImageItem, index: number) => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (r <= 0) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    return;
  }
  const clampedR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + clampedR, y);
  ctx.lineTo(x + w - clampedR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
  ctx.lineTo(x + w, y + h - clampedR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
  ctx.lineTo(x + clampedR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
  ctx.lineTo(x, y + clampedR);
  ctx.quadraticCurveTo(x, y, x + clampedR, y);
  ctx.closePath();
}

/**
 * 2D 좌표 (col, row)에 대해 무작위성과 고른 분산을 보장하고,
 * 가로/세로 인접 셀 간 동일 이미지 중복을 수학적으로 방지하는 결정론적 인덱스 계산기
 */
export function getCellIndex(col: number, row: number, total: number): number {
  if (total <= 1) return 0;
  if (total === 2) {
    const c = ((col % 2) + 2) % 2;
    const r = ((row % 2) + 2) % 2;
    return (c + r) % 2;
  }

  const c = ((col % total) + total) % total;
  const r = ((row % total) + total) % total;

  // total과 서로소(gcd=1)인 계수 k를 선택하여 세로 방향 인접 셀과의 충돌 방지
  let k = 2;
  while (total % k === 0) {
    k++;
  }

  const base = (c + r * k) % total;

  // 결정론적 1:1 순열(Permutation) 매핑: (base * prime + offset) % total
  // prime이 total과 서로소이면 1:1 전단사 함수가 되어 비인접성이 100% 보존되면서 시각적 무작위 순서가 생성됨
  let primeMultiplier = 7;
  while (total % primeMultiplier === 0 || primeMultiplier === total) {
    primeMultiplier += 2;
  }

  return (base * primeMultiplier + 11) % total;
}

/** 그림자 번짐(8)과 y 오프셋(3)을 담는 여백 */
const SHADOW_PAD = 16;

/** 이 속도(px/프레임) 아래로 떨어지면 정지로 보고 다시 그리기 중단 */
const REST_VELOCITY = 0.01;

// 셀 크기로 미리 축소해 매 프레임 원본 디코딩·축소를 피함
function rasterize(
  img: HTMLImageElement,
  w: number,
  h: number,
  dpr: number,
): CanvasImageSource {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// 카드 그림자를 한 번만 그려 두고 재사용 (shadowBlur는 매 프레임 비용이 큼)
function createShadowSprite(
  w: number,
  h: number,
  r: number,
  dpr: number,
): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((w + SHADOW_PAD * 2) * dpr);
  canvas.height = Math.round((h + SHADOW_PAD * 2) * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.shadowColor = "rgba(0, 0, 0, 0.07)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, SHADOW_PAD, SHADOW_PAD, w, h, r);
  ctx.fill();
  return canvas;
}

export function InfiniteImageField({
  className,
  items,
  images,
  imageWidth = 180,
  imageHeight = 250,
  gap = 24,
  maxSpeed = 4,
  smoothing = 0.06,
  borderRadius = 0,
  onItemClick,
  ...rest
}: InfiniteImageFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<(CanvasImageSource | null)[]>([]);
  const shadowRef = useRef<HTMLCanvasElement | null>(null);
  const activeItemsRef = useRef<InfiniteImageItem[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });
  const camRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const isInsideRef = useRef(false);
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number>(0);
  const scheduleDrawRef = useRef<() => void>(() => {});

  // 화면 근처에 오기 전(또는 display:none)에는 이미지를 받지 않음
  const [isNearViewport, setIsNearViewport] = useState(false);

  // Normalize image data (support either items object or string array)
  const normalizedItems: InfiniteImageItem[] = (
    items && items.length > 0
      ? items
      : (images || INFINITE_IMAGE_FIELD_IMAGES).map((url, idx) => ({
          id: idx,
          image: url,
        }))
  ).filter((item) => Boolean(item.image));

  const safeItems: InfiniteImageItem[] =
    normalizedItems.length > 0
      ? normalizedItems
      : [{ id: 0, image: "/images/placeholder-image.svg" }];

  activeItemsRef.current = safeItems;
  const imageKey = safeItems.map((i) => i.image).join(",");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          scheduleDrawRef.current();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pre-load images
  useEffect(() => {
    if (!isNearViewport) return;
    let cancelled = false;
    const dpr = window.devicePixelRatio || 1;
    const list = activeItemsRef.current;
    spritesRef.current = list.map(() => null);

    list.forEach((item, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        spritesRef.current[idx] = rasterize(img, imageWidth, imageHeight, dpr);
        scheduleDrawRef.current();
      };
      img.src = item.image;
    });

    return () => {
      cancelled = true;
    };
  }, [isNearViewport, imageKey, imageWidth, imageHeight]);

  const draw = useCallback(() => {
    rafRef.current = 0;
    if (!isVisibleRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w: W, h: H } = dimsRef.current;
    if (W === 0 || H === 0) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = imageWidth + gap;
    const cellH = imageHeight + gap;
    const sprites = spritesRef.current;
    const numImages = Math.max(activeItemsRef.current.length, 1);

    if (!shadowRef.current || shadowRef.current.dataset.dpr !== String(dpr)) {
      shadowRef.current = createShadowSprite(
        imageWidth,
        imageHeight,
        borderRadius,
        dpr,
      );
      if (shadowRef.current) shadowRef.current.dataset.dpr = String(dpr);
    }
    const shadow = shadowRef.current;

    // Physics — cursor offset from center drives velocity
    const tx = isInsideRef.current
      ? (mouseRef.current.x - 0.5) * 2 * maxSpeed
      : 0;
    const ty = isInsideRef.current
      ? (mouseRef.current.y - 0.5) * 2 * maxSpeed
      : 0;

    velRef.current.x += (tx - velRef.current.x) * smoothing;
    velRef.current.y += (ty - velRef.current.y) * smoothing;

    if (
      !isInsideRef.current &&
      Math.abs(velRef.current.x) < REST_VELOCITY &&
      Math.abs(velRef.current.y) < REST_VELOCITY
    ) {
      velRef.current.x = 0;
      velRef.current.y = 0;
    }

    camRef.current.x += velRef.current.x;
    camRef.current.y += velRef.current.y;

    const camX = camRef.current.x;
    const camY = camRef.current.y;

    ctx.clearRect(0, 0, W, H);

    // Compute visible cell range
    const colMin = Math.floor((camX - W / 2) / cellW) - 1;
    const colMax = Math.ceil((camX + W / 2) / cellW) + 1;
    const rowMin = Math.floor((camY - H / 2) / cellH) - 1;
    const rowMax = Math.ceil((camY + H / 2) / cellH) + 1;

    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        // Top-left corner in screen space
        const sx = col * cellW - camX + W / 2 - imageWidth / 2;
        const sy = row * cellH - camY + H / 2 - imageHeight / 2;

        // Deterministic image assignment — avoiding adjacent collision
        const imgIdx = getCellIndex(col, row, numImages);
        const sprite = sprites[imgIdx];

        // Soft shadow card (pre-rendered)
        if (shadow) {
          ctx.drawImage(
            shadow,
            sx - SHADOW_PAD,
            sy - SHADOW_PAD,
            imageWidth + SHADOW_PAD * 2,
            imageHeight + SHADOW_PAD * 2,
          );
        }

        // 사각형이면 그리는 영역이 곧 셀이므로 클립 생략
        const needsClip = borderRadius > 0;
        if (needsClip) {
          ctx.save();
          drawRoundedRect(ctx, sx, sy, imageWidth, imageHeight, borderRadius);
          ctx.clip();
        }

        if (sprite) {
          ctx.drawImage(sprite, sx, sy, imageWidth, imageHeight);
        } else {
          ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
          ctx.fillRect(sx, sy, imageWidth, imageHeight);
        }

        if (needsClip) ctx.restore();

        // Subtle crisp border outline
        drawRoundedRect(ctx, sx, sy, imageWidth, imageHeight, borderRadius);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 커서가 안에 있거나 관성이 남았을 때만 다음 프레임 예약
    const isMoving =
      isInsideRef.current || velRef.current.x !== 0 || velRef.current.y !== 0;
    if (isMoving) rafRef.current = requestAnimationFrame(draw);
  }, [imageWidth, imageHeight, gap, maxSpeed, smoothing, borderRadius]);

  const scheduleDraw = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
  }, [draw]);
  scheduleDrawRef.current = scheduleDraw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      dimsRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      scheduleDraw();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      scheduleDraw();
    };

    const onEnter = () => {
      isInsideRef.current = true;
      scheduleDraw();
    };
    const onLeave = () => {
      isInsideRef.current = false;
      scheduleDraw();
    };
    const onClick = (e: MouseEvent) => {
      if (!onItemClick) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const { w: W, h: H } = dimsRef.current;
      const cellW = imageWidth + gap;
      const cellH = imageHeight + gap;
      const camX = camRef.current.x;
      const camY = camRef.current.y;
      const numImages = Math.max(activeItemsRef.current.length, 1);

      const col = Math.round((clickX + camX - W / 2) / cellW);
      const row = Math.round((clickY + camY - H / 2) / cellH);

      const sx = col * cellW - camX + W / 2 - imageWidth / 2;
      const sy = row * cellH - camY + H / 2 - imageHeight / 2;

      if (
        clickX >= sx &&
        clickX <= sx + imageWidth &&
        clickY >= sy &&
        clickY <= sy + imageHeight
      ) {
        const imgIdx = getCellIndex(col, row, numImages);
        const item = activeItemsRef.current[imgIdx];
        if (item) {
          onItemClick(item, imgIdx);
        }
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    scheduleDraw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [draw, scheduleDraw, imageWidth, imageHeight, gap, onItemClick]);

  return (
    <div
      {...rest}
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden select-none",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block w-full h-full bg-transparent" />
    </div>
  );
}
