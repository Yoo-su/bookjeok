import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ReviewWriteView } from "@/views/review-write-view";

export const metadata: Metadata = {
  title: "리뷰 작성",
  description: "읽은 책에 대한 감상을 공유해주세요.",
};

export default function Page() {
  return (
    <AuthGuard>
      <ReviewWriteView />
    </AuthGuard>
  );
}
