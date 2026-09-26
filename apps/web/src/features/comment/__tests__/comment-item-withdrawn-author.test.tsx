import { Comment, CommentTargetType } from "@bookjeok/core";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CommentItem } from "@/features/comment/components/common/comment-section/comment-item";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));
vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/features/confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/features/comment/mutations", () => ({
  useDeleteCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleCommentLikeMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const base = {
  id: 1,
  content: "댓글",
  targetType: CommentTargetType.BOOK,
  targetId: "9791190000000",
  likeCount: 0,
  isLiked: false,
  createdAt: "2026-09-22T00:00:00.000Z",
  updatedAt: "2026-09-22T00:00:00.000Z",
} satisfies Partial<Comment>;

const renderItem = (comment: Comment) =>
  render(
    <CommentItem
      comment={comment}
      targetType={comment.targetType}
      targetId={comment.targetId}
      page={1}
    />,
  );

describe("CommentItem 작성자 표시", () => {
  it("작성자가 있으면 닉네임을 프로필 링크로 보여준다", () => {
    const { container } = renderItem({
      ...base,
      userId: 2,
      user: {
        id: 2,
        handle: "reader",
        nickname: "독자",
        profileImageUrl: null,
      },
    });

    expect(container.querySelector('a[href*="reader"]')).not.toBeNull();
  });

  it("탈퇴한 작성자의 댓글도 링크 없이 렌더링한다", () => {
    const { container } = renderItem({ ...base, userId: null, user: null });

    expect(screen.getAllByText("unknown_author").length).toBeGreaterThan(0);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("댓글")).toBeInTheDocument();
  });
});
