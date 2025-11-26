import { Heart } from "lucide-react";
import Link from "next/link";

import { WishlistItem } from "@/features/user/components/wishlist-item";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { WishlistItem as WishlistItemType } from "../types";

interface WishlistListProps {
  wishlist: WishlistItemType[] | undefined;
  isLoading: boolean;
}

export const WishlistList = ({ wishlist, isLoading }: WishlistListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-32 rounded-lg" />
        ))}
      </div>
    );
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
          <Link href="/">홈으로 가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {wishlist.map((item) => (
        <WishlistItem key={item.id} item={item} />
      ))}
    </div>
  );
};
