"use client";

import { useCallback, useRef } from "react";

interface CoolModeProps {
  children: React.ReactNode;
  options?: {
    particleCount?: number;
    speed?: number; // 1 to 10
    size?: number; // size in px
  };
}

const getParticle = (x: number, y: number, size: number) => {
  const particle = document.createElement("div");
  particle.style.position = "fixed";
  particle.style.left = "0";
  particle.style.top = "0";
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.borderRadius = "50%";
  // Circle shape and random pastel colors
  const colors = [
    "#FFC1CC", // pastel red
    "#FFD1A1", // pastel orange
    "#FFF7AD", // pastel yellow
    "#C8E6C9", // pastel green
    "#B3E5FC", // pastel blue
    "#E1BEE7", // pastel purple
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  particle.style.backgroundColor = color;

  // Initial position
  particle.style.transform = `translate(${x}px, ${y}px)`;
  particle.style.pointerEvents = "none";
  particle.style.zIndex = "9999";

  return particle;
};

export const CoolMode = ({ children, options }: CoolModeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const particleSize = options?.size || 8;
  const speedScale = options?.speed || 2;
  const particleCount = options?.particleCount || 30;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      if (rect) {
        for (let i = 0; i < particleCount; i++) {
          const particle = getParticle(
            clickX,
            clickY,
            Math.random() * particleSize + 2,
          );
          document.body.appendChild(particle);

          const angle = Math.random() * Math.PI * 2;
          const velocity = Math.random() * 10 * speedScale;

          let opacity = 1;

          // Optimized animation loop variables within closure
          let x = clickX;
          let y = clickY;
          const horz = Math.cos(angle) * velocity;
          let vert = Math.sin(angle) * velocity;

          const step = () => {
            vert += 0.8; // Gravity
            x += horz;
            y += vert;
            opacity -= 0.02;

            particle.style.transform = `translate(${x}px, ${y}px)`;
            particle.style.opacity = opacity.toString();

            if (opacity > 0) {
              requestAnimationFrame(step);
            } else {
              particle.remove();
            }
          };
          requestAnimationFrame(step);
        }
      }
    },
    [particleCount, particleSize, speedScale],
  );

  return (
    <div ref={ref} onClick={handleClick}>
      {children}
    </div>
  );
};
