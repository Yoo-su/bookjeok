import { reviewKeys, ReviewReactionType, type User } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { ReviewDetailActions } from "./actions";

const REVIEW_ID = 1;

function ActionsPlayground() {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    // 아직 아무 반응도 누르지 않은 상태
    c.setQueryData(
      [...reviewKeys.detail(REVIEW_ID).queryKey, "reaction"],
      null,
    );
    return c;
  });
  const [likes, setLikes] = useState(9);

  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-wrap gap-2 text-xs">
          {[-1, 1, 91].map((step) => (
            <button
              key={step}
              type="button"
              className="whitespace-nowrap rounded-md border border-stone-200 px-2.5 py-1.5"
              onClick={() => setLikes((n) => Math.max(0, n + step))}
            >
              좋아요 수 {step > 0 ? `+${step}` : step}
            </button>
          ))}
        </div>
        <ReviewDetailActions
          reviewId={String(REVIEW_ID)}
          reactionCounts={{
            [ReviewReactionType.LIKE]: likes,
            [ReviewReactionType.INSIGHTFUL]: 120,
            [ReviewReactionType.SUPPORT]: 0,
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/Review/ReviewDetailActions",
  component: ActionsPlayground,
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
} satisfies Meta<typeof ActionsPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 반응을 누르면 아이콘마다 다른 움직임과 함께 점이 퍼진다.
 * 서버가 없어 요청은 실패하고 토스트가 뜬다
 */
export const LoggedIn: Story = {
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
};

/** 위 버튼으로 수를 바꾸면 바뀐 자리만 굴러간다. 9 → 10처럼 자릿수가 늘 때도 */
export const CountChanges: Story = {};
