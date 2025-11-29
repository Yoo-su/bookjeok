import { AuthGuard } from "@/features/auth/components/auth-guard";
import { WishlistView } from "@/views/wishlist-view";

export default function Page() {
  return (
    <AuthGuard>
      <WishlistView />
    </AuthGuard>
  );
}
