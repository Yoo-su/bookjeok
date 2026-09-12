"use client";

import { usePopularKeywordsQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ChevronDown } from "@/shared/components/icons/iconsax";
import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils";

/**
 * 인기 검색어 컴포넌트
 *
 * 기능:
 * - 3초 간격으로 인기 검색어가 슬라이드업 애니메이션으로 전환
 * - hover 시 전체 Top 10 목록이 드롭다운으로 표시
 * - 검색어 클릭 시 해당 검색어로 즉시 검색
 */
export const PopularKeywords = () => {
  const t = useTranslations("book.search");
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading } = usePopularKeywordsQuery();
  // 기본값은 undefined에만 걸린다. 형태가 어긋난 200은 그대로 통과해 아래 map에서 터진다.
  const keywords = Array.isArray(data) ? data : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 3초마다 다음 검색어로 전환 (hover 시 일시정지)
  useEffect(() => {
    if (keywords.length <= 1 || isHovered || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % keywords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [keywords.length, isHovered, isPaused]);

  // 검색어 클릭 핸들러
  const handleKeywordClick = useCallback(
    (keyword: string) => {
      const params = new URLSearchParams();
      params.set("q", keyword);
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.pushState(null, "", newUrl);
      setIsHovered(false);
    },
    [pathname],
  );

  // 로딩 중이거나 데이터가 없으면 렌더링하지 않음
  if (isLoading || keywords.length === 0) {
    return null;
  }

  const currentKeyword = keywords[currentIndex];

  return (
    <div
      className="relative inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-zinc-200 shadow-sm hover:shadow-lg hover:border-zinc-300 cursor-pointer transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 라벨 */}
      <span className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
        {t("popular_label")}
      </span>

      <div className="w-px h-3 bg-zinc-200" />

      {/* 슬라이드업 애니메이션 영역 */}
      <div className="relative h-6 overflow-hidden min-w-[100px]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: 24, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -24, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center text-base font-medium text-zinc-800 truncate"
            onClick={() => handleKeywordClick(currentKeyword.keyword)}
          >
            {currentKeyword.keyword}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* 드롭다운 화살표 */}
      <ChevronDown
        className={cn(
          "w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 group-hover:text-zinc-600",
          isHovered ? "rotate-180" : "",
        )}
      />

      {/* Hover 드롭다운 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 ring-1 ring-zinc-900/5 overflow-hidden z-50"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* 헤더 */}
            <div className="px-5 py-3 border-b border-zinc-100 bg-white/50">
              <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
                {t("popular_top", { count: keywords.length })}
              </span>
            </div>

            {/* 검색어 목록 */}
            <ul className="py-2 max-h-[320px] overflow-y-auto custom-scrollbar">
              {keywords.map((item, index) => (
                <li key={item.keyword}>
                  <button
                    type="button"
                    onClick={() => handleKeywordClick(item.keyword)}
                    className={cn(
                      "w-full px-5 py-3 flex items-center gap-4 hover:bg-zinc-50/80 transition-all group/item",
                      index === currentIndex && "bg-zinc-50",
                    )}
                  >
                    {/* 순위 (가독성 개선: 더 진한 텍스트/배경) */}
                    <span
                      className={cn(
                        "w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full transition-colors",
                        index < 3
                          ? "text-white bg-zinc-800"
                          : "text-zinc-600 bg-zinc-100 group-hover/item:bg-zinc-200",
                      )}
                    >
                      {index + 1}
                    </span>

                    {/* 키워드 */}
                    <span className="flex-1 text-left text-sm text-zinc-700 font-medium truncate group-hover/item:text-zinc-900">
                      {item.keyword}
                    </span>

                    {/* 검색 횟수 (가독성 개선: 더 진한 색상) */}
                    <span className="text-[11px] text-zinc-400 font-medium group-hover/item:text-zinc-500 tabular-nums">
                      {item.searchCount.toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
