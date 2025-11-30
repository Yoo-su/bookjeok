import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ReviewEditView } from "@/views/review-edit-view";

export default function EditReviewPage() {
  return (
    <AuthGuard>
      <ReviewEditView />
    </AuthGuard>
  );
}
