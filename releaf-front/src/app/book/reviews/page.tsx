import { Metadata } from "next";

import { ReviewListView } from "@/views/review-list-view";

export const metadata: Metadata = {
  title: "리뷰 목록",
  description: "다양한 책에 대한 솔직한 리뷰를 만나보세요.",
};

export default function Page() {
  return <ReviewListView />;
}
