"use client";

import { CommentTargetType } from "@bookjeok/core";
import { useCommentsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Pagination } from "@/shared/components/ui/pagination";

import { CommentItem } from "./comment-item";

interface CommentListProps {
  targetType: CommentTargetType;
  targetId: string;
  page: number;
  onPageChange: (page: number) => void;
  enabled?: boolean;
}

/**
 * 댓글 목록 + 페이지네이션
 */
export const CommentList = ({
  targetType,
  targetId,
  page,
  onPageChange,
  enabled = true,
}: CommentListProps) => {
  const viewerId = useAuthStore((state) => state.user?.id);
  const { data, isLoading, isError } = useCommentsQuery(
    targetType,
    targetId,
    page,
    10,
    enabled,
    viewerId,
  );
  const t = useTranslations("comment.list");

  if (isLoading) {
    return <CommentListSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">{t("error")}</div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">{t("empty")}</p>
        <p className="text-sm mt-1">{t("empty_desc")}</p>
      </div>
    );
  }

  const { data: comments, meta } = data;

  return (
    <div className="space-y-4">
      {/* 댓글 목록 */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            targetType={targetType}
            targetId={targetId}
            page={page}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        onPageChange={onPageChange}
        className="mt-6"
      />
    </div>
  );
};

/**
 * 로딩 스켈레톤
 */
const CommentListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-card/50 border border-border/50 rounded-xl p-4"
      >
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
