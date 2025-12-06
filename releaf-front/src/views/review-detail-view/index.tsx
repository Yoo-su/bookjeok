"use client";

import { useParams } from "next/navigation";

import { ReviewDetail } from "@/features/review/components/review-detail";
import { Review } from "@/features/review/types";

interface ReviewDetailViewProps {
  initialReview?: Review | null;
}

export const ReviewDetailView = ({ initialReview }: ReviewDetailViewProps) => {
  const params = useParams();
  const id = Number(params.id);

  return <ReviewDetail id={id} initialReview={initialReview} />;
};
