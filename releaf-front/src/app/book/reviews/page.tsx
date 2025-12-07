import { Metadata } from "next";

import { ReviewHomeView } from "@/views/review-home-view";

export const metadata: Metadata = {
  title: "리뷰 홈",
  description: "다양한 책에 대한 솔직한 리뷰를 만나보세요.",
};

export default function Page() {
  return <ReviewHomeView />;
}
