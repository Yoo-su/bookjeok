import type { LoungeBookCard } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { LoungeFeedCard } from "./index";

// === Mock Data ===
const mockDate = new Date().toISOString();

const mockGeneralReaders = [
  {
    userId: 1,
    nickname: "독서광",
    handle: "reader_one",
    profileImageUrl: "default_profile1",
    date: mockDate,
    memo: "참 좋은 책이네요.",
  },
  {
    userId: 2,
    nickname: "책벌레",
    handle: "bookworm",
    profileImageUrl: "default_profile2",
    date: new Date(Date.now() - 100000).toISOString(),
    memo: undefined,
  },
  {
    userId: 3,
    nickname: "지혜의샘",
    handle: "wisdom_well",
    profileImageUrl: null,
    date: new Date(Date.now() - 500000).toISOString(),
    memo: "인생책!",
  },
];

const mockBaseBook: LoungeBookCard["book"] = {
  isbn: "9788937460784",
  title: "데미안",
  author: "헤르만 헤세",
  publisher: "민음사",
  description: "헤르만 헤세의 대표작",
  image: "https://cdn.bookjeok.com/covers/9788932912363.webp",
  link: "",
  discount: "7200",
  pubdate: "20000101",
};

const defaultCardData: LoungeBookCard = {
  isbn: mockBaseBook.isbn,
  book: mockBaseBook,
  latestDate: mockDate,
  readers: mockGeneralReaders.slice(0, 3),
  totalReaderCount: 3,
};

// === Storybook Meta ===
const meta = {
  title: "Feature/Lounge/LoungeFeedCard",
  component: LoungeFeedCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "480px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onCardClick: { action: "clicked" },
  },
  args: {
    onCardClick: () => {},
  },
} satisfies Meta<typeof LoungeFeedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// === Stories ===

/**
 * 기본 형태 (일반적인 카드 화면)
 */
export const Default: Story = {
  args: {
    item: defaultCardData,
  },
};

/**
 * 수십 명의 사용자가 읽고 있는 인기 도서 카드
 * 아바타가 겹쳐 보이고 +N 형태의 뱃지가 우측에 나옵니다.
 */
export const ManyReaders: Story = {
  args: {
    item: {
      ...defaultCardData,
      readers: [
        ...mockGeneralReaders,
        {
          userId: 4,
          nickname: "네번째",
          handle: "four",
          profileImageUrl: "default_profile4",
          date: mockDate,
          memo: undefined,
        },
      ],
      totalReaderCount: 42,
    },
  },
};

/**
 * 최근 활동 카드 (최신에 기록된 책)
 */
export const RecentActivity: Story = {
  args: {
    item: {
      ...defaultCardData,
      book: {
        ...mockBaseBook,
        title: "트렌드 코리아 2024",
        author: "김난도 외",
      },
      latestDate: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5분 전
    },
  },
};

/**
 * 책 표지 이미지가 없는 경우 (기본 타이틀 Fallback 표시)
 */
export const NoBookImage: Story = {
  args: {
    item: {
      ...defaultCardData,
      book: {
        ...mockBaseBook,
        title: "이미지가 없는 독립출판물",
        image: "",
      },
    },
  },
};

/**
 * 긴 텍스트 테스트용 (제목과 저자명이 아주 길 때 `line-clamp` 처리 확인)
 */
export const LongText: Story = {
  args: {
    item: {
      ...defaultCardData,
      book: {
        ...mockBaseBook,
        title:
          "아주 긴 제목의 책 테스트입니다. 이 제목은 두 줄, 세 줄 이상 길어질 수 있고, 모바일 화면에서는 말줄임 처리가 정확하게 이루어져야 합니다.",
        author:
          "매우 긴 저자 이름을 가진 사람 1, 엄청 긴 이름을 가진 사람 2, 그리고 또 다른 지은이 외 10명 공저",
      },
    },
  },
};
