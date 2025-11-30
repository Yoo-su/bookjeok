import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ReviewWriteView } from "@/views/review-write-view";

export default function WriteReviewPage() {
  return (
    <AuthGuard>
      <ReviewWriteView />
    </AuthGuard>
  );
}
