"use client";

import {
  CheckCircle,
  Clock,
  LucideIcon,
  MessageCircle,
  PenLine,
  ShoppingBag,
} from "lucide-react";

import { useMyStatsQuery, UserStats } from "@/features/user/queries";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils/cn";

interface StatItem {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  getValue: (stats: UserStats | undefined) => number;
}

// 통계 항목 정의
const statItems: StatItem[] = [
  {
    key: "forSale",
    label: "판매중",
    icon: ShoppingBag,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    getValue: (stats) => stats?.salesStatusCounts?.FOR_SALE ?? 0,
  },
  {
    key: "reserved",
    label: "예약중",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    getValue: (stats) => stats?.salesStatusCounts?.RESERVED ?? 0,
  },
  {
    key: "sold",
    label: "완료",
    icon: CheckCircle,
    color: "text-stone-400",
    bgColor: "bg-stone-100",
    getValue: (stats) => stats?.salesStatusCounts?.SOLD ?? 0,
  },
  {
    key: "chats",
    label: "채팅",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    getValue: (stats) => stats?.chatRoomCount ?? 0,
  },
  {
    key: "reviews",
    label: "리뷰",
    icon: PenLine,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    getValue: (stats) => stats?.reviewsCount ?? 0,
  },
];

export const UserStatsDashboard = () => {
  const { data: stats, isLoading } = useMyStatsQuery();

  if (isLoading) {
    return <UserStatsDashboardSkeleton />;
  }

  return (
    <Card className="mb-8 overflow-hidden">
      <CardContent className="p-0">
        {/* 모바일: 그리드 레이아웃 / 데스크톱: 가로 행 */}
        <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-stone-100">
          {statItems.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center justify-center gap-1 py-4 px-2"
            >
              <div className={cn("p-2 rounded-lg", item.bgColor)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-stone-900">
                {item.getValue(stats)}
              </p>
              <p className="text-[10px] sm:text-xs text-stone-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const UserStatsDashboardSkeleton = () => (
  <Card className="mb-8 overflow-hidden">
    <CardContent className="p-0">
      <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-stone-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-1 py-4 px-2"
          >
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-6 mt-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export { UserStatsDashboardSkeleton };
