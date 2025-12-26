"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { BookOpen, Calendar, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SaleStatusBadge } from "@/features/book/components/common/sale-status-badge";
import { SaleStatus } from "@/features/book/types";
import { usePublicProfileQuery } from "@/features/user/queries";
import { Card, CardContent, CardHeader } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PATHS } from "@/shared/constants/paths";

interface UserProfileViewProps {
  userId: number;
}

export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  const { data: profile, isLoading, error } = usePublicProfileQuery(userId);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <NotFoundRedirect
        message="존재하지 않거나 삭제된 사용자입니다."
        useBack
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 프로필 헤더 */}
      <Card className="mb-8">
        <CardContent className="flex items-center gap-6 p-6">
          <div className="relative w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
            {profile.profileImageUrl ? (
              <Image
                src={profile.profileImageUrl}
                alt={profile.nickname}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-stone-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-stone-900">
              {profile.nickname}
            </h1>
            <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(profile.createdAt), "yyyy년 M월 가입", {
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 활동 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-emerald-50">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {profile.stats.salesCount}
              </p>
              <p className="text-sm text-stone-500">판매 중인 도서</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-blue-50">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {profile.stats.reviewsCount}
              </p>
              <p className="text-sm text-stone-500">작성한 리뷰</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 리뷰 */}
      {profile.recentReviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">최근 리뷰</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.recentReviews.map((review) => (
              <Link
                key={review.id}
                href={PATHS.REVIEW_DETAIL(review.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <div className="relative w-12 h-16 rounded overflow-hidden bg-stone-100 shrink-0">
                  {review.bookImage ? (
                    <Image
                      src={review.bookImage}
                      alt={review.bookTitle}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-stone-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {review.title}
                  </p>
                  <p className="text-sm text-stone-500 truncate">
                    {review.bookTitle}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 최근 판매글 */}
      {profile.recentSales.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">최근 판매 도서</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.recentSales.map((sale) => (
              <Link
                key={sale.id}
                href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <div className="relative w-12 h-16 rounded overflow-hidden bg-stone-100 shrink-0">
                  {sale.bookImage ? (
                    <Image
                      src={sale.bookImage}
                      alt={sale.bookTitle}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-stone-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {sale.bookTitle}
                  </p>
                  <p className="text-sm text-stone-500">
                    {sale.price.toLocaleString()}원
                  </p>
                </div>
                <SaleStatusBadge status={sale.status as SaleStatus} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * 로딩 스켈레톤
 */
const UserProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-4xl">
    <Card className="mb-8">
      <CardContent className="flex items-center gap-6 p-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-2 gap-4 mb-8">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>
);
