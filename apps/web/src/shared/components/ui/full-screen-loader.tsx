"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// 파스텔 컬러 팔레트 (CoolMode 스타일)
const PARTICLE_COLORS = [
  "#D4C5A9", // warm sand
  "#C2B280", // khaki
  "#E8DCC8", // cream
  "#B8A88A", // tan
  "#A89B7E", // stone warm
  "#D6CDB7", // parchment
  "#C9B99A", // wheat
  "#E0D5C0", // linen
];

/** CoolMode 물리 엔진을 응용한 파티클 생성 함수 */
const createParticle = (
  centerX: number,
  centerY: number,
  size: number,
): HTMLElement => {
  const particle = document.createElement("div");
  particle.style.position = "fixed";
  particle.style.left = "0";
  particle.style.top = "0";
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.borderRadius = "50%";
  particle.style.pointerEvents = "none";
  particle.style.zIndex = "9999";
  particle.style.transform = `translate(${centerX}px, ${centerY}px)`;

  const color =
    PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  particle.style.backgroundColor = color;
  // 부드러운 글로우 효과
  particle.style.boxShadow = `0 0 ${size}px ${color}80`;

  return particle;
};

/** 파티클 버스트를 한 번 발사하는 함수 */
const emitBurst = (centerX: number, centerY: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 8 + 3;
    const particle = createParticle(centerX, centerY, size);
    document.body.appendChild(particle);

    // 위쪽으로만 쏘아올리기 (팝콘처럼 튀어오르는 느낌)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const velocity = Math.random() * 6 + 4;

    let x = centerX;
    let y = centerY;
    const horz = Math.cos(angle) * velocity;
    let vert = Math.sin(angle) * velocity;
    let opacity = 1;

    const step = () => {
      vert += 0.25; // 중력 (CoolMode보다 약하게 → 더 우아하게 떠다님)
      x += horz;
      y += vert;
      opacity -= 0.015;

      particle.style.transform = `translate(${x}px, ${y}px) scale(${Math.max(opacity, 0)})`;
      particle.style.opacity = opacity.toString();

      if (opacity > 0) {
        requestAnimationFrame(step);
      } else {
        particle.remove();
      }
    };
    // 파티클마다 약간의 딜레이로 팝콘 튀는 타이밍 분산
    setTimeout(() => requestAnimationFrame(step), Math.random() * 100);
  }
};

export const FullScreenLoader = () => {
  const t = useTranslations("common.loader.messages");
  const loadingTexts = useMemo(
    () => ["0", "1", "2", "3", "4"].map((key) => t(key)),
    [t],
  );

  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const logoRef = useRef<HTMLDivElement>(null);

  // 타이핑 애니메이션
  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % loadingTexts.length;
      const fullText = loadingTexts[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1),
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, loadingTexts]);

  // CoolMode 스타일 자동 팝콘 파티클 발사
  const emitFromLogo = useCallback(() => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    emitBurst(cx, cy, 6);
  }, []);

  useEffect(() => {
    // 초기 딜레이 후 시작
    const startTimer = setTimeout(() => {
      emitFromLogo();
    }, 300);

    const interval = setInterval(() => {
      emitFromLogo();
    }, 500);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [emitFromLogo]);

  return (
    <div className="flex flex-col items-center justify-center h-dvh w-screen bg-linear-to-b from-stone-50 via-white to-stone-50 fixed inset-0 z-999 overflow-hidden">
      <div className="relative flex flex-col items-center justify-center gap-10">
        {/* 로고 + 파티클 영역 */}
        <div className="relative flex items-center justify-center w-56 h-56">
          {/* 부드러운 글로우 아우라 */}
          <motion.div
            className="absolute w-36 h-36 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(168,155,126,0.15) 0%, rgba(168,155,126,0.05) 50%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(214,205,183,0.1) 0%, transparent 60%)",
            }}
            animate={{
              scale: [1.1, 1.5, 1.1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />

          {/* 둥둥 떠다니는 메인 로고 */}
          <motion.div
            ref={logoRef}
            className="relative w-24 h-24 z-10"
            animate={{ y: [-6, 6, -6] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/logo-square-sketch.svg"
              alt="북적"
              fill
              unoptimized
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                filter: "drop-shadow(0 4px 20px rgba(168,155,126,0.3))",
              }}
            />
          </motion.div>
        </div>

        {/* 타이핑 텍스트 */}
        <div className="h-8 flex items-center justify-center">
          <motion.span
            key={loopNum}
            className="text-stone-600 text-base font-medium font-serif tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {text}
            <motion.span
              className="ml-0.5 text-stone-400 inline-block"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              |
            </motion.span>
          </motion.span>
        </div>

        {/* 미니멀 로딩 인디케이터 */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-stone-300"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
