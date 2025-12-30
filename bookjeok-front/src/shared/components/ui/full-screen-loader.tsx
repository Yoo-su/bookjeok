"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

const LOADING_TEXTS = [
  "잠시만 기다려주세요...",
  "책을 찾고 있습니다...",
  "데이터를 불러오는 중입니다...",
  "거의 다 되었습니다...",
  "bookjeok에서 함께하는 독서 여행",
];

export const FullScreenLoader = () => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % LOADING_TEXTS.length;
      const fullText = LOADING_TEXTS[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
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
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white fixed inset-0 z-100 overflow-hidden">
      <div className="relative flex flex-col items-center justify-center gap-12">
        {/* 로고 컨테이너 (물결 및 플로팅 애니메이션 포함) */}
        <div className="relative flex items-center justify-center w-64 h-64">
          {/* 물결 효과 */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute inset-0 rounded-full border border-emerald-200/40 bg-emerald-100/10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: 2.5,
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}

          {/* 팝콘처럼 튀어오르는 로고들 */}
          {[...Array(12)].map((_, i) => (
            <PopcornLogo key={`popcorn-${i}`} index={i} total={12} />
          ))}

          {/* 둥둥 떠있는 메인 로고 */}
          <motion.div
            className="relative w-28 h-28 z-10"
            animate={{ y: [-8, 8, -8] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/logo.svg"
              alt="북적"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </motion.div>
        </div>

        {/* 커스텀 타이핑 애니메이션 텍스트 */}
        <div className="h-8 flex items-center justify-center">
          <motion.span
            key={loopNum}
            className="text-emerald-900 text-lg font-medium leading-normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {text}
            <span className="animate-pulse ml-1 text-emerald-500">|</span>
          </motion.span>
        </div>
      </div>
    </div>
  );
};

const PopcornLogo = ({ index, total }: { index: number; total: number }) => {
  const [mounted, setMounted] = useState(false);
  const [randoms, setRandoms] = useState({ x: 0, y: 0, r: 0, d: 0 });

  useEffect(() => {
    setMounted(true);
    setRandoms({
      x: (Math.random() - 0.5) * 200, // 조금 더 멀리 퍼지게
      y: (Math.random() - 0.5) * 200,
      r: (Math.random() - 0.5) * 360,
      d: Math.random() * 2,
    });
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className="absolute z-0"
      initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        x: randoms.x,
        y: randoms.y,
        rotate: randoms.r,
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2.5, // 조금 더 천천히
        repeat: Infinity,
        delay: index * 0.2 + randoms.d,
        ease: "easeOut",
      }}
    >
      <div className="relative w-6 h-6 opacity-80">
        <Image
          src="/logo.svg"
          alt="mini-logo"
          fill
          className="object-contain"
        />
      </div>
    </motion.div>
  );
};
