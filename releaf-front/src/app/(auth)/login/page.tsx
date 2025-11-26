import { GuestGuard } from "@/features/auth/components/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { LoginView } from "@/views/login-view";

export default function LoginPage() {
  return (
    <GuestGuard>
      <DefaultLayout>
        <LoginView />
      </DefaultLayout>
    </GuestGuard>
  );
}
