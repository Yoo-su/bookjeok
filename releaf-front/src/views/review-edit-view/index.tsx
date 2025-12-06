"use client";

import { useParams } from "next/navigation";

import { ReviewEdit } from "@/features/review/components/review-edit";

export const ReviewEditView = () => {
  const params = useParams();
  const id = Number(params.id);

  return <ReviewEdit id={id} />;
};
