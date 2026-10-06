import {
  type Comment,
  commentKeys,
  CommentTargetType,
  type GetCommentsResponse,
  type User,
} from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { CommentList } from "./comment-list";

const VIEWER_ID = 1;
const TARGET_ID = "1";
const KEY = commentKeys.list(
  CommentTargetType.REVIEW,
  TARGET_ID,
  1,
  VIEWER_ID,
).queryKey;

const makeComment = (id: number, likeCount = 0): Comment => ({
  id,
  content: `${id}번째 댓글이에요. 저도 이 장면에서 한참 멈춰 있었어요.`,
  targetType: CommentTargetType.REVIEW,
  targetId: TARGET_ID,
  userId: 2,
  user: { id: 2, handle: "reader", nickname: "독자", profileImageUrl: null },
  likeCount,
  isLiked: false,
  createdAt: "2026-09-22T00:00:00.000Z",
  updatedAt: "2026-09-22T00:00:00.000Z",
});

/** 서버 대신 캐시를 고쳐 쓰기·지우기·좋아요 수 변화를 흉내 낸다 */
function CommentsPlayground({ initialCount }: { initialCount: number }) {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    c.setQueryData<GetCommentsResponse>(KEY, {
      data: [makeComment(3, 9), makeComment(2, 1), makeComment(1)].slice(
        3 - initialCount,
      ),
      meta: { page: 1, limit: 10, total: initialCount, totalPages: 1 },
    } as GetCommentsResponse);
    return c;
  });

  const update = (fn: (comments: Comment[]) => Comment[]) =>
    client.setQueryData<GetCommentsResponse>(KEY, (old) =>
      old ? { ...old, data: fn(old.data) } : old,
    );

  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() =>
              update((list) => [
                makeComment(Math.max(0, ...list.map((c) => c.id)) + 1),
                ...list,
              ])
            }
          >
            새 댓글 달기
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() => update((list) => list.filter((_, i) => i !== 1))}
          >
            두 번째 댓글 지우기
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() => update((list) => list.slice(1))}
          >
            맨 위 댓글 지우기
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-200 px-2.5 py-1.5"
            onClick={() =>
              update((list) =>
                list.map((c, i) =>
                  i === 0 ? { ...c, likeCount: c.likeCount + 1 } : c,
                ),
              )
            }
          >
            첫 댓글에 다른 사람 좋아요 +1
          </button>
        </div>
        <CommentList
          targetType={CommentTargetType.REVIEW}
          targetId={TARGET_ID}
          page={1}
          onPageChange={() => {}}
        />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Comment/CommentList",
  component: CommentsPlayground,
  parameters: { layout: "padded" },
  args: { initialCount: 3 },
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: VIEWER_ID, nickname: "미리보기" } as unknown as User,
    });
  },
} satisfies Meta<typeof CommentsPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * - 새 댓글은 맨 위에서 살짝 올라오며 나타나고, 아래 댓글은 밀려 내려간다
 * - 지운 댓글은 사라지고 아래 댓글이 그 자리로 당겨진다
 * - 좋아요 수는 바뀐 자리만 굴러간다
 * - 하트를 누르면 점이 퍼진다. 서버가 없어 요청은 실패하고 토스트가 뜬다
 */
export const Interactions: Story = {};

/**
 * 댓글이 없는 책·리뷰. 첫 댓글을 달면 빈 안내가 빠지고 댓글이 올라오며 나타나고,
 * 마지막 댓글을 지우면 반대로 빈 안내가 돌아온다
 */
export const FromEmpty: Story = { args: { initialCount: 0 } };
