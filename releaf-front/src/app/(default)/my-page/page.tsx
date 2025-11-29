import { AuthGuard } from "@/features/auth/components/auth-guard";
import { MyPageView } from "@/views/my-page-view";

export default function MyPage() {
  return (
    <AuthGuard>
      <MyPageView />
    </AuthGuard>
  );
}
