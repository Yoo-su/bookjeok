"use client";

import { WishlistList } from "@/features/user/components/wishlist-list";
import { useWishlistQuery } from "@/features/user/queries";

export const WishlistView = () => {
  const { data: wishlist, isLoading } = useWishlistQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">위시리스트</h1>
      <WishlistList wishlist={wishlist} isLoading={isLoading} />
    </div>
  );
};
