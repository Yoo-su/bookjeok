"use client";

import { AnimatePresence, motion, useMotionTemplate } from "framer-motion";
import React, { useCallback, useMemo, useState } from "react";

import { cn } from "@/shared/utils";

interface Position {
  x: number;
  y: number;
}

interface LensProps {
  /** The children of the lens, typically a next/image component */
  children: React.ReactNode;
  /** The zoom factor of the lens */
  zoomFactor?: number;
  /** The size of the lens circle */
  lensSize?: number;
  /** The color of the lens mask */
  lensColor?: string;
  /** Additional class names for the container */
  className?: string;
}

export const Lens = ({
  children,
  zoomFactor = 1.5, // 확대 배율
  lensSize = 150, // 돋보기 크기
  lensColor = "black", // 마스크 색상 (일반적으로 검은색)
  className,
}: LensProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsHovering(false);
  }, []);

  // Framer Motion을 사용하여 마우스 위치에 따라 원형 마스크를 생성합니다.
  const maskImage = useMotionTemplate`radial-gradient(circle ${
    lensSize / 2
  }px at ${mousePosition.x}px ${
    mousePosition.y
  }px, ${lensColor} 100%, transparent 100%)`;

  // 확대된 이미지를 담을 컨텐츠를 Memoization합니다.
  const LensContent = useMemo(() => {
    const { x, y } = mousePosition;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.1 }}
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomFactor})`,
            transformOrigin: `${x}px ${y}px`,
          }}
        >
          {children}
        </div>
      </motion.div>
    );
  }, [mousePosition, lensSize, lensColor, zoomFactor, children]);

  return (
    <div
      // next/image의 fill 속성을 위해 position: relative가 필요합니다.
      className={cn("relative z-20 overflow-hidden rounded-xl", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Zoom Area"
      tabIndex={0}
    >
      {/* 기본 이미지 (확대되지 않은 상태) */}
      {children}

      {/* 마우스를 올렸을 때만 확대된 이미지를 보여줍니다. */}
      <AnimatePresence>{isHovering && LensContent}</AnimatePresence>
    </div>
  );
};
