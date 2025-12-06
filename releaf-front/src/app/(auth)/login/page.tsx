import { Metadata } from "next";

import { GuestGuard } from "@/features/auth/components/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { LoginView } from "@/views/login-view";

export const metadata: Metadata = {
  title: "로그인",
  description: "ReLeaf에 로그인하고 더 많은 기능을 이용해보세요.",
};

export default function Page() {
  return (
    <GuestGuard>
      <DefaultLayout>
        <LoginView />
      </DefaultLayout>
    </GuestGuard>
  );
}
