import { type PublicUserProfile, userKeys } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UserProfile } from "./index";

const HANDLE = "bookworm";

const PROFILE: PublicUserProfile = {
  id: 7,
  handle: HANDLE,
  nickname: "책벌레",
  profileImageUrl: null,
  createdAt: "2025-03-01T00:00:00.000Z",
  isEmailVerified: true,
  lastActiveAt: "2026-10-05T09:00:00.000Z",
  stats: { salesCount: 2, reviewsCount: 5 },
  recentReviews: [],
  recentSales: [],
};

function withProfile(Story: () => React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(userKeys.publicProfile(HANDLE).queryKey, PROFILE);
  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/User/UserProfile",
  component: UserProfile,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { handle: HANDLE },
  decorators: [withProfile],
} satisfies Meta<typeof UserProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 독서 · 거래 후기 탭을 오가면 밑줄이 미끄러져 옮겨 간다.
 * 탭 아래 목록은 서버가 없어 비거나 오류로 보인다
 */
export const Tabs: Story = {};
