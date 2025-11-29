"use client";

import { Edit } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/shadcn/button";

interface ReviewDetailActionsProps {
  isAuthor: boolean;
  reviewId: string;
}

export function ReviewDetailActions({
  isAuthor,
  reviewId,
}: ReviewDetailActionsProps) {
  return (
    <div className="mt-16 pt-8 border-t border-stone-100 flex items-center justify-between">
      <Button
        variant="ghost"
        className="text-stone-500 hover:text-stone-900"
        asChild
      >
        <Link href="/review">← Back to Reviews</Link>
      </Button>

      {isAuthor && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-stone-200 hover:bg-stone-50"
            asChild
          >
            <Link href={`/review/${reviewId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Review
            </Link>
          </Button>
          {/* 삭제 버튼이 여기에 들어갈 예정입니다. */}
        </div>
      )}
    </div>
  );
}
