import type { Review } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { ReviewTicker } from "./review-ticker";

const BOOKS = [
  { title: "데미안", author: "헤르만 헤세", publisher: "민음사" },
  {
    title: "아주 작은 습관의 힘",
    author: "제임스 클리어",
    publisher: "비즈니스북스",
  },
  { title: "코스모스", author: "칼 세이건", publisher: "사이언스북스" },
  {
    title: "미드나잇 라이브러리",
    author: "매트 헤이그",
    publisher: "인플루엔셜",
  },
  { title: "사피엔스", author: "유발 하라리", publisher: "김영사" },
  { title: "불편한 편의점", author: "김호연", publisher: "나무옆의자" },
  {
    title: "물고기는 존재하지 않는다",
    author: "룰루 밀러",
    publisher: "곰출판",
  },
];

const makeReview = (index: number): Review => {
  const book = BOOKS[index % BOOKS.length];
  return {
    id: index + 1,
    title: `${book.title}를 읽고 ${index + 1}번째로 남기는 기록`,
    content: `<p>${book.title}는 읽는 내내 문장을 곱씹게 만드는 책이었다. 특히 중반부의 전개가 인상 깊었다.</p>`,
    isbn: `978893746078${index % 10}`,
    rating: 3 + (index % 5) * 0.5,
    tags: ["인생책", "밑줄", "재독"].slice(0, (index % 3) + 1),
    category: "소설",
    viewCount: 100 + index,
    userId: index + 1,
    isPublic: true,
    reactionCount: index,
    user: {
      id: index + 1,
      handle: `reader_${index}`,
      nickname: `독자${index + 1}`,
      profileImageUrl: "default_profile3",
    },
    book: {
      isbn: `978893746078${index % 10}`,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: "",
      image: "/logo-square-sketch.png",
      link: "",
      discount: "12000",
      pubdate: "20220101",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * index).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * index).toISOString(),
  } as unknown as Review;
};

const meta = {
  title: "Feature/ReviewTicker",
  component: ReviewTicker,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 20건을 순환시키는 기본 상태. 4초마다 맨 위 한 줄이 밀려 올라간다. */
export const Rotating: Story = {
  args: {
    reviews: Array.from({ length: 20 }, (_, i) => makeReview(i)),
  },
};

/** 보이는 줄 수(5) 이하면 순환하지 않고 정적 목록으로 남는다. */
export const NotEnoughToRotate: Story = {
  args: {
    reviews: Array.from({ length: 4 }, (_, i) => makeReview(i)),
  },
};
