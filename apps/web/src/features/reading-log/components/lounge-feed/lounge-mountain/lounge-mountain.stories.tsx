import {
  type LoungeMountainResponse,
  MOUNTAIN_LANDMARKS,
  type MyMountainShareResponse,
  readingLogKeys,
  type User,
} from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { SAMPLE_BOOKS } from "../../stack-view/lib/sample-books";
import { LoungeMountain } from ".";

const READERS = ["책벌레", "밤독서", "수현", "한줄요정", "느린독자"];

/** 예시 46권을 돌려 count권짜리 책동산을 만든다. 마지막 week권은 이번 주에 올린 것 */
function fixture(count: number, week: number): LoungeMountainResponse {
  const now = Date.now();
  const books = Array.from({ length: count }, (_, i) => {
    const b = SAMPLE_BOOKS[i % SAMPLE_BOOKS.length];
    const hoursAgo =
      i >= count - week ? (count - i) * 5 : 24 * 8 + (count - i) * 7;
    return {
      ...b,
      logId: `log-${i}`,
      addedAt: new Date(now - hoursAgo * 3_600_000).toISOString(),
      reader: READERS[i % READERS.length],
    };
  });
  let cum = 0;
  let li = 0;
  const milestones: LoungeMountainResponse["milestones"] = [];
  for (const b of books) {
    cum += b.depth;
    while (
      li < MOUNTAIN_LANDMARKS.length &&
      cum >= MOUNTAIN_LANDMARKS[li].heightMm
    ) {
      milestones.push({
        landmark: MOUNTAIN_LANDMARKS[li].id,
        reachedAt: b.addedAt,
        isbn: b.isbn,
        title: b.title,
        reader: { nickname: b.reader, handle: b.reader },
      });
      li += 1;
    }
  }
  const recent = books.slice(-week);
  return {
    totalMm: cum,
    bookCount: count,
    readerCount: READERS.length,
    weekMm: recent.reduce((a, b) => a + b.depth, 0),
    weekCount: recent.length,
    bands: books.map((b) => ({ mm: b.depth, color: b.coverColor ?? "#ddd" })),
    peak: books
      .slice(-8)
      .reverse()
      .map((b) => ({
        logId: b.logId,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        height: b.height,
        depth: b.depth,
        coverColor: b.coverColor,
        addedAt: b.addedAt,
        reader: { nickname: b.reader, handle: b.reader, profileImageUrl: null },
      })),
    milestones,
  };
}

const PREVIEW_USER = {
  id: 1,
  nickname: "수현",
  handle: "suhyun",
  profileImageUrl: null,
} as unknown as User;

/** 책동산 전체 중 myCount권(약 myMm)을 내가 올렸다고 친다 */
function share(
  data: LoungeMountainResponse,
  myMm: number,
  myCount: number,
): MyMountainShareResponse {
  return { myMm, myCount, totalMm: data.totalMm };
}

function Seeded({
  data,
  width,
  mine,
}: {
  data: LoungeMountainResponse;
  width: number;
  /** 없으면 비로그인. myCount 0이면 로그인했지만 산에 내 책이 없음(비공개 등) */
  mine?: MyMountainShareResponse;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(readingLogKeys.loungeMountain.queryKey, data);
  if (mine) client.setQueryData(readingLogKeys.mountainMine.queryKey, mine);
  useAuthStore.setState({ user: mine ? PREVIEW_USER : null });
  return (
    <QueryClientProvider client={client}>
      <div style={{ maxWidth: width, padding: 16, boxSizing: "border-box" }}>
        <LoungeMountain />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/ReadingLog/Lounge/LoungeMountain",
  component: Seeded,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Seeded>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 2026-09-30 운영과 비슷한 규모: 약 175권, 다음은 기린 */
export const Now: Story = { args: { data: fixture(175, 9), width: 1100 } };

export const NowPhone: Story = { args: { data: fixture(175, 9), width: 375 } };

/** 기린을 넘고 첨성대를 바라볼 때 */
export const TowardCheomseongdae: Story = {
  args: { data: fixture(330, 20), width: 1100 },
};

export const TowardCheomseongdaePhone: Story = {
  args: { data: fixture(330, 20), width: 375 },
};

/** 막 시작한 책동산. 이번 주 기록 없음 */
export const Small: Story = { args: { data: fixture(24, 0), width: 375 } };

const NOW = fixture(175, 9);

/** 로그인 + 공개 + 12권 올림 */
export const WithMyShare: Story = {
  args: { data: NOW, width: 1100, mine: share(NOW, 248, 12) },
};

export const WithMySharePhone: Story = {
  args: { data: NOW, width: 375, mine: share(NOW, 248, 12) },
};

/** 한 권만 올린 사람. 0.1% 미만이면 숫자 대신 「0.1% 미만」 */
export const WithTinyShare: Story = {
  args: { data: NOW, width: 1100, mine: share(NOW, 3, 1) },
};

/** 로그인했지만 비공개 설정이라 산에 내 책이 없음 → 표시 안 함 */
export const PrivateUser: Story = {
  args: { data: NOW, width: 1100, mine: share(NOW, 0, 0) },
};
