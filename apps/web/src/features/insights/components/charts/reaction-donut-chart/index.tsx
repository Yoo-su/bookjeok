"use client";

import { ReactionStat, ReviewReactionType } from "@bookjeok/core";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { REACTION_COLORS } from "@/features/insights/constants/ui";
import { REACTION_CONFIG } from "@/features/review/constants/ui";
import { Heart } from "@/shared/components/icons/iconsax";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
    </div>
  ),
});

interface ReactionDonutChartProps {
  data: ReactionStat[];
}

/**
 * 리액션 분포 도넛 차트
 */
export const ReactionDonutChart = ({ data }: ReactionDonutChartProps) => {
  const t = useTranslations("insights.charts.reaction");
  const tReactions = useTranslations("review.reactions");
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const hasData = total > 0;

  // 리액션 타입별 라벨 매핑
  const getReactionLabel = (type: string) => {
    const config = REACTION_CONFIG.find((r) => r.type === type);
    return config ? tReactions(config.labelKey) : type;
  };

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        fontFamily: "inherit",
      },
      labels: data.map((item) => getReactionLabel(item.type)),
      colors: Object.values(ReviewReactionType).map(
        (type) => REACTION_COLORS[type],
      ),
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontWeight: 600,
              },
              value: {
                show: true,
                fontSize: "20px",
                fontWeight: 700,
                formatter: (val: string) => val,
              },
              total: {
                show: true,
                label: t("total"),
                fontSize: "12px",
                color: "#6b7280",
                formatter: () => total.toLocaleString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "bottom" as const,
        horizontalAlign: "center" as const,
        fontSize: "13px",
        markers: {
          size: 10,
          shape: "circle" as const,
        },
        itemMargin: {
          horizontal: 12,
          vertical: 8,
        },
      },
      stroke: {
        width: 0,
      },
      tooltip: {
        y: {
          formatter: (val: number) =>
            t("tooltip", {
              count: val,
              ratio: ((val / total) * 100).toFixed(1),
            }),
        },
      },
    }),
    [data, total, t],
  );

  const series = useMemo(() => data.map((item) => item.count), [data]);

  return (
    <InsightCard
      title={t("title")}
      description={t("desc")}
      icon={<Heart className="h-5 w-5" />}
    >
      {hasData ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="donut"
          height={300}
        />
      ) : (
        <EmptyState message={t("empty")} />
      )}
    </InsightCard>
  );
};
