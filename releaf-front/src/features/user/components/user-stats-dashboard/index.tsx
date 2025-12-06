import { MessageCircle } from "lucide-react";

import { useMyStatsQuery } from "@/features/user/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";

import { UserStatsDashboardSkeleton } from "./skeleton";

export const UserStatsDashboard = () => {
  const { data: stats, isLoading } = useMyStatsQuery();

  if (isLoading) {
    return <UserStatsDashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">판매중</CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.salesStatusCounts?.FOR_SALE || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            현재 판매 중인 상품
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">예약중</CardTitle>
          <div className="h-2 w-2 rounded-full bg-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.salesStatusCounts?.RESERVED || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            예약 진행 중인 상품
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">판매완료</CardTitle>
          <div className="h-2 w-2 rounded-full bg-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.salesStatusCounts?.SOLD || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            거래가 완료된 상품
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">참여중인 채팅</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.chatRoomCount || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">활성화된 채팅방</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">작성한 리뷰</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.reviewsCount || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">내가 쓴 리뷰</p>
        </CardContent>
      </Card>
    </div>
  );
};
