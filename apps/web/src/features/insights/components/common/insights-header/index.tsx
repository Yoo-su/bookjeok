import { useTranslations } from "next-intl";

import {
  BarChart3,
  BookOpen,
  Heart,
  ShoppingBag,
  Tag,
} from "@/shared/components/icons/iconsax";

interface InsightsHeaderProps {
  summary: {
    totalSales: number;
    totalReviews: number;
    totalReactions: number;
    totalTags: number;
  };
}

/**
 * 인사이트 페이지 헤더 + 요약 통계
 * - Editorial Style (Clean, Typography-focused)
 */
export const InsightsHeader = ({ summary }: InsightsHeaderProps) => {
  const t = useTranslations("insights");

  const stats = [
    {
      label: t("summary.sales"),
      value: summary.totalSales,
      icon: ShoppingBag,
    },
    {
      label: t("summary.reviews"),
      value: summary.totalReviews,
      icon: BookOpen,
    },
    {
      label: t("summary.reactions"),
      value: summary.totalReactions,
      icon: Heart,
    },
    {
      label: t("summary.tags"),
      value: summary.totalTags,
      icon: Tag,
    },
  ];

  return (
    <div className="mb-12">
      {/* 타이틀 */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-3 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-stone-500 text-lg font-light tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      {/* 요약 카드 (Simple Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-white p-6 flex flex-col items-center justify-center hover:bg-stone-50 transition-colors duration-300"
          >
            <div className="mb-2 text-stone-400 group-hover:text-stone-600 transition-colors">
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-800 mb-1">
              {(stat.value ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
