"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils/cn";

export const READING_TOOLBAR_GAP = 12;

/** Fade the passing text only while the toolbar is attached below the header. */
export function StickyReadingSurface({
  top,
  className,
  children,
}: {
  top: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      setStuck(bounds.height > 0 && bounds.top <= top + 1);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [top]);
  return (
    <div
      ref={ref}
      data-reading-surface
      className={cn("sticky", className)}
      style={{ top }}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-full h-16 transition-opacity duration-200 motion-reduce:transition-none",
          stuck ? "opacity-100" : "opacity-0",
        )}
      >
        {[1, 2, 4, 8, 16].map((blur, index) => (
          <span
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: `linear-gradient(to bottom, transparent ${index * 15}%, black ${Math.min(100, index * 15 + 35)}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${index * 15}%, black ${Math.min(100, index * 15 + 35)}%)`,
            }}
          />
        ))}
        <span className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/70" />
      </div>
      {children}
    </div>
  );
}
