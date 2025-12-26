"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Heart,
  MessageSquare,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store";
import { UserStatsDashboard } from "@/features/user/components/user-stats-dashboard";
import { WithdrawalModal } from "@/features/user/components/withdrawal-modal";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { PATHS } from "@/shared/constants/paths";

// 활동 메뉴 정의
const activityMenus = [
  {
    icon: ShoppingBag,
    label: "나의 판매 내역",
    description: "등록한 중고책 판매글 관리",
    href: PATHS.MY_PAGE_SALES,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: BookOpen,
    label: "나의 리뷰",
    description: "작성한 도서 리뷰 확인",
    href: PATHS.MY_REVIEWS,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Heart,
    label: "위시리스트",
    description: "찜한 도서 목록",
    href: PATHS.MY_PAGE_WISHLIST,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  {
    icon: MessageSquare,
    label: "나의 댓글",
    description: "작성한 댓글 관리",
    href: PATHS.MY_COMMENTS,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
];

export const MyPageView = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">마이 페이지</h1>

      {/* 프로필 섹션 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* 아바타 */}
            <div
              className="relative w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden"
              data-nosnippet
            >
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={user.nickname}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-stone-400" />
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-stone-900">
                {user.nickname}
              </h2>
              <p className="text-stone-500 text-sm mt-1">{user.email}</p>
              {user.createdAt && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-stone-400 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(user.createdAt), "yyyy년 M월 가입", {
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 대시보드 */}
      <UserStatsDashboard />

      {/* 활동 메뉴 */}
      <h3 className="text-lg font-semibold mb-4">활동 관리</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {activityMenus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="block">
            <Card className="hover:bg-stone-50 transition-colors h-full">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${menu.bgColor}`}>
                  <menu.icon className={`w-5 h-5 ${menu.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900">{menu.label}</p>
                  <p className="text-xs text-stone-500 truncate">
                    {menu.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
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
