"use client";

import { PopularTagStat } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { COLORS } from "@/features/insights/constants/ui";
import { Tag } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface PopularTagsListProps {
  data: PopularTagStat[];
}

/**
 * 인기 태그 배지 리스트
 * - Editorial Style: Simple, Minimal, Monochrome chips
 */
export const PopularTagsList = ({ data }: PopularTagsListProps) => {
  const t = useTranslations("insights.charts.tags");
  const tAria = useTranslations("common.aria");
  const hasData = data.length > 0;

  const maxCount = Math.max(...data.map((t) => t.count), 1);

  const getBadgeSize = (count: number): string => {
    const ratio = count / maxCount;
    // 사이즈 차이를 조금 더 은은하게 조정
    if (ratio > 0.7) return "text-base px-4 py-2 font-bold";
    if (ratio > 0.4) return "text-sm px-3 py-1.5 font-semibold";
    return "text-xs px-2.5 py-1 font-medium";
  };

  return (
    <InsightCard
      title={t("title")}
      description={t("desc")}
      icon={<Tag className="h-5 w-5" />}
    >
      {hasData ? (
        <div className="flex flex-wrap gap-2 items-center justify-center py-4">
          {data.map((tag, index) => {
            // 미묘한 명도 차이로 리듬감 부여 (홀/짝)
            const isEven = index % 2 === 0;
            const bgColor = isEven ? COLORS.stone[100] : COLORS.stone[50];
            const hoverColor = COLORS.stone[200];

            return (
              <Link
                key={tag.name}
                href={PATHS.REVIEWS_BY_TAG(tag.name)}
                aria-label={tAria("tag_filter", { tag: tag.name })}
                className={`inline-flex items-center gap-1.5 rounded-full border border-stone-200 text-stone-600 transition-all duration-300 hover:scale-105 hover:border-stone-400 hover:text-stone-900 hover:shadow-sm ${getBadgeSize(tag.count)}`}
                style={{ backgroundColor: bgColor }}
              >
                <span className="font-serif italic text-stone-400">#</span>
                <span>{tag.name}</span>
                <span className="text-[0.7em] text-stone-400 font-light ml-0.5">
                  {tag.count}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState message={t("empty")} />
      )}
    </InsightCard>
  );
};
