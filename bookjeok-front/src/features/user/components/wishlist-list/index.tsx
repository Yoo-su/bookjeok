"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { WishlistItem } from "@/features/user/components/wishlist-item";
import { useWishlistQuery } from "@/features/user/queries";
import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

import { WishlistSkeleton } from "./skeleton";

/**
 * 위시리스트 목록을 보여주는 컴포넌트입니다.
 * 내부에서 useWishlistQuery를 호출하여 데이터를 가져옵니다.
 */
export const WishlistList = () => {
  const { data: wishlist, isLoading } = useWishlistQuery();

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart className="w-16 h-16 mb-4 text-gray-200" />
        <h2 className="text-xl font-semibold text-gray-900">
          위시리스트가 비어있습니다.
        </h2>
        <p className="mt-2 text-gray-500">
          마음에 드는 책이나 판매글을 찜해보세요!
        </p>
        <Button asChild className="mt-6">
          <Link href={PATHS.HOME}>홈으로 가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {wishlist.map((item) => (
        <WishlistItem key={item.id} item={item} />
      ))}
    </div>
  );
};
