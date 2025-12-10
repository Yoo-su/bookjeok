"use client";

import { WishlistList } from "@/features/user/components/wishlist-list";

export const WishlistView = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 py-4">위시리스트</h1>
      <WishlistList />
    </div>
  );
};
