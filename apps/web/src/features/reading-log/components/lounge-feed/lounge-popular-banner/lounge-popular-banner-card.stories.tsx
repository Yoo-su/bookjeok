import type { LoungePopularBook } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { LoungePopularBannerCard } from "./lounge-popular-banner-card";

// === Mock Data ===
const mockRecentReaders = [
  {
    nickname: "독서광",
    handle: "reader_one",
    profileImageUrl: "default_profile1",
  },
  {
    nickname: "책벌레",
    handle: "bookworm",
    profileImageUrl: "default_profile2",
  },
  {
    nickname: "지혜의샘",
    handle: "wisdom_well",
    profileImageUrl: null,
  },
];

const defaultItemData: LoungePopularBook = {
  isbn: "9788937460784",
  book: {
    isbn: "9788937460784",
    title: "데미안",
    author: "헤르만 헤세",
    publisher: "민음사",
    description: "헤르만 헤세의 대표작",
    image: "https://cdn.bookjeok.com/covers/9788932912363.webp",
    link: "",
    discount: "7200",
    pubdate: "20000101",
  },
  readerCount: 3,
  recentReaders: mockRecentReaders,
};

// === Storybook Meta ===
const meta = {
  title: "Feature/Lounge/LoungePopularBannerCard",
  component: LoungePopularBannerCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "200px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoungePopularBannerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// === Stories ===

/**
 * 인기 배너 카드의 기본 형태입니다.
 */
export const Default: Story = {
  args: {
    item: defaultItemData,
    index: 0,
  },
};

/**
 * 수십 명 이상이 읽고 있는 엄청난 인기 도서 형태입니다.
 * +N 형태의 숫자가 아바타들 우측 바깥에 깔끔하게 표기되어야 합니다.
 */
export const MassivePopularity: Story = {
  args: {
    item: {
      ...defaultItemData,
      recentReaders: [
        ...mockRecentReaders,
        {
          nickname: "열정맨",
          handle: "passion",
          profileImageUrl: "default_profile4",
        },
      ],
      readerCount: 156, // 아주 많은 독자수
    },
    index: 0,
  },
};

/**
 * 책 표지 이미지가 없는 도서(독립출판물 등)의 Fallback 형태입니다.
 */
export const NoBookImage: Story = {
  args: {
    item: {
      ...defaultItemData,
      book: {
        ...defaultItemData.book,
        title: "이미지가 등록되지 않은 책",
        image: "",
      },
    },
    index: 0,
  },
};

/**
 * 제목과 저자명이 매우 길어 말줄임 처리가 필요한 형태입니다.
 */
export const VeryLongText: Story = {
  args: {
    item: {
      ...defaultItemData,
      book: {
        ...defaultItemData.book,
        title:
          "세상에서 가장 길고 철학적인 제목을 가진 엄청난 두께의 베스트셀러",
        author: "아주 긴 이름을 가진 저자와 그 친구들 모임 지음",
      },
    },
    index: 0,
  },
};
