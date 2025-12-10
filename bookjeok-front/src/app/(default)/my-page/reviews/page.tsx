import { Metadata } from "next";

import MyReviewsPage from "@/views/my-reviews-view";

export const metadata: Metadata = {
  title: "내가 쓴 리뷰",
  description: "내가 작성한 도서 리뷰들을 모아보세요.",
};

export default function Page() {
  return <MyReviewsPage />;
}
