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
        <div className="relative flex items-center justify-center w-40 h-40">
          {/* 물결 효과 */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full bg-sky-100/50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2.0, opacity: [0, 0.5, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* 둥둥 떠있는 로고 */}
          <motion.div
            className="relative w-28 h-28 z-10"
            animate={{ y: [-10, 10, -10] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/logo.svg"
              alt="bookjeok Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </motion.div>
        </div>

        {/* 커스텀 타이핑 애니메이션 텍스트 */}
        <div className="h-8 flex items-center justify-center">
          <motion.span
            key={loopNum} // 선택 사항: 단어가 바뀔 때 애니메이션을 적용하려면 사용
            className="text-[#1a2a4b] text-lg font-medium leading-normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {text}
            <span className="animate-pulse ml-1">|</span>
          </motion.span>
        </div>
      </div>
    </div>
  );
};
