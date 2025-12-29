"use client";

import { BarChart3, BookOpen, Heart, ShoppingBag, Tag } from "lucide-react";

// 색상 팔레트
const COLORS = {
  matcha: { dark: "#4b6043", medium: "#658354" },
  cream: { light: "#faf7f2", medium: "#f5f0e6", dark: "#e8dfd0" },
  mustard: { dark: "#d4a72c", medium: "#e5b84c" },
};

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
 */
export const InsightsHeader = ({ summary }: InsightsHeaderProps) => {
  const stats = [
    {
      label: "등록된 판매글",
      value: summary.totalSales,
      icon: ShoppingBag,
      bgColor: COLORS.cream.medium,
      iconColor: COLORS.matcha.dark,
    },
    {
      label: "작성된 리뷰",
      value: summary.totalReviews,
      icon: BookOpen,
      bgColor: COLORS.cream.light,
      iconColor: COLORS.mustard.dark,
    },
    {
      label: "누적 리액션",
      value: summary.totalReactions,
      icon: Heart,
      bgColor: COLORS.cream.dark,
      iconColor: "#e07a5f", // 따뜻한 코랄
    },
    {
      label: "사용된 태그",
      value: summary.totalTags,
      icon: Tag,
      bgColor: COLORS.cream.medium,
      iconColor: COLORS.matcha.medium,
    },
  ];

  return (
    <div className="mb-8">
      {/* 타이틀 */}
      <div className="mb-6 text-center">
        <div
          className="mb-3 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: COLORS.cream.medium }}
        >
          <BarChart3
            className="h-5 w-5"
            style={{ color: COLORS.matcha.dark }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: COLORS.matcha.dark }}
          >
            Live Stats
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          bookjeok 서비스 현황
        </h1>
        <p className="mt-2 text-gray-500">
          실시간으로 업데이트되는 서비스 통계를 확인해보세요
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{ backgroundColor: stat.bgColor }}
          >
            <div className="mb-3 flex items-center gap-2">
              <stat.icon
                className="h-4 w-4"
                style={{ color: stat.iconColor }}
              />
              <span className="text-xs font-medium text-gray-600">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
