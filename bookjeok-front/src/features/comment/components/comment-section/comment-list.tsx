"use client";

import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { useCommentsQuery } from "../../queries";
import { CommentTargetType } from "../../types";
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
  const { data, isLoading, isError } = useCommentsQuery(
    targetType,
    targetId,
    page,
    enabled
  );

  if (isLoading) {
    return <CommentListSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        댓글을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">아직 댓글이 없습니다.</p>
        <p className="text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
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
      {meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

/**
 * 페이지네이션 컴포넌트
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  // 표시할 페이지 번호 계산 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);

    // 시작 조정
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {/* 이전 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3"
      >
        ←
      </Button>

      {/* 페이지 번호들 */}
      {pageNumbers[0] > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="px-3"
          >
            1
          </Button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {pageNumbers.map((num) => (
        <Button
          key={num}
          variant={num === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(num)}
          className="px-3"
        >
          {num}
        </Button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="px-3"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* 다음 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        →
      </Button>
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
