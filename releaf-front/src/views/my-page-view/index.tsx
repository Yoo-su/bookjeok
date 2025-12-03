"use client";

import { ChevronRight, MessageCircle, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store";
import { WithdrawalModal } from "@/features/user/components/withdrawal-modal";
import { useMyStatsQuery } from "@/features/user/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { PATHS } from "@/shared/constants/paths";

export const MyPageView = () => {
  const user = useAuthStore((state) => state.user);
  const { data: stats, isLoading } = useMyStatsQuery();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">마이 페이지</h1>

      {/* 프로필 섹션 */}
      <Card className="mb-8">
        <CardContent className="flex items-center p-6">
          <div className="relative w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-6">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={user.nickname}
                fill
                sizes="80px"
                className="rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.nickname}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 대시보드 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">판매중</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.salesStatusCounts?.FOR_SALE || 0}
              </div>
            )}
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
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.salesStatusCounts?.RESERVED || 0}
              </div>
            )}
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
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.salesStatusCounts?.SOLD || 0}
              </div>
            )}
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
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.chatRoomCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              활성화된 채팅방
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성한 리뷰</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.reviewsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">내가 쓴 리뷰</p>
          </CardContent>
        </Card>
      </div>

      {/* 메뉴 링크 */}
      <div className="space-y-4 mb-12">
        <Link href={PATHS.MY_PAGE_SALES} className="block">
          <Card className="hover:bg-gray-50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="mr-4 h-5 w-5 text-gray-500" />
                <span className="font-medium">나의 판매 내역 관리</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        {/* 추후 추가될 메뉴들... */}
      </div>

      {/* 위험 구역 (탈퇴) */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-medium text-red-900">회원 탈퇴</h4>
            <p className="text-sm text-red-700 mt-1">
              탈퇴 시 모든 데이터가 삭제되거나 익명화되며 복구할 수 없습니다.
            </p>
          </div>
          <WithdrawalModal />
        </div>
      </div>
    </div>
  );
};
