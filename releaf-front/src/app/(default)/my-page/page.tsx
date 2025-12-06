import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { MyPageView } from "@/views/my-page-view";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 활동 내역과 정보를 확인하세요.",
};

export default function Page() {
  return (
    <AuthGuard>
      <MyPageView />
    </AuthGuard>
  );
}
