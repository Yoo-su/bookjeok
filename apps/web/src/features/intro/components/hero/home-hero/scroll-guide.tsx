"use client";

import { motion } from "motion/react";

// -----------------------------------------------------------------------------
// 컴포넌트: 스크롤 가이드 (Scroll Guide)
// 역할: 히어로 섹션과 하단 컨텐츠를 시각적으로 연결하는 'The Kinetic Thread'
// 스타일: 미니멀, 감각적인 모션, 1%의 유니크함
// -----------------------------------------------------------------------------
export const ScrollGuide = () => {
  return (
    <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center pb-6">
      {/* 
        시각적 메타포: '차원으로의 진입' (Entry to Dimension)
        단순한 화살표가 아닌, 에너지/데이터/흐름이 아래로 주입되는 듯한 느낌 
      */}

      {/* 1. The Thread (가이드 라인) */}
      <div className="relative h-12 w-px overflow-hidden bg-zinc-100">
        {/* 2. The Pulse (흐르는 에너지) */}
        <motion.div
          className="absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-zinc-400 to-transparent"
          initial={{ y: "-100%" }}
          animate={{ y: "150%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5,
          }}
        />
      </div>

      {/* 3. The Drop (맺힘) - 아주 미세한 끝점 */}
      <motion.div
        className="mt-1 h-1 w-1 rounded-full bg-zinc-300"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.5,
          delay: 1, // 선이 내려온 뒤 반응
        }}
      />
    </div>
  );
};
