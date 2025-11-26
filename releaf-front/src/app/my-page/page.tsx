import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { MyPageView } from "@/views/my-page-view";

export default function MyPage() {
  return (
    <AuthGuard>
      <DefaultLayout>
        <MyPageView />
      </DefaultLayout>
    </AuthGuard>
  );
}
