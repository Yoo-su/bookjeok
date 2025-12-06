"use client";

import { MyReviewList } from "@/features/review/components/my-review-list";

export default function MyReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">내가 쓴 리뷰</h1>
      <MyReviewList />
    </div>
  );
}
