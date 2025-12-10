import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ReviewEditView } from "@/views/review-edit-view";

export const metadata: Metadata = {
  title: "리뷰 수정",
  description: "도서 리뷰 수정 페이지입니다.",
};

export default function Page() {
  return (
    <AuthGuard>
      <ReviewEditView />
    </AuthGuard>
  );
}
