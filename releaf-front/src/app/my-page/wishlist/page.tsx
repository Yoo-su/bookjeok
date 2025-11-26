import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { WishlistView } from "@/views/wishlist-view";

export default function Page() {
  return (
    <AuthGuard>
      <DefaultLayout>
        <div className="container max-w-2xl py-8 mx-auto">
          <WishlistView />
        </div>
      </DefaultLayout>
    </AuthGuard>
  );
}
