import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { WishlistView } from "@/views/wishlist-view";

export const metadata: Metadata = {
  title: "위시리스트",
  description: "찜해둔 책과 판매글을 확인하세요.",
};

export default function Page() {
  return (
    <AuthGuard>
      <WishlistView />
    </AuthGuard>
  );
}
