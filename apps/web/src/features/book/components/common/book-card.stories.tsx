import { BookInfo } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";

import { BookCard } from "./book-card";

// 목데이터
const mockBook: BookInfo = {
  isbn: "9788937460784",
  title: "데미안",
  author: "헤르만 헤세",
  publisher: "민음사",
  description: "헤르만 헤세의 대표작 데미안. 자아를 찾아가는 성장 소설의 꽃.",
  image: "https://cdn.bookjeok.com/covers/9788932912363.webp",
  link: "https://book.naver.com/bookdb/book_detail.nhn?bid=1234",
  discount: "7200",
  pubdate: "20000101",
};

const meta = {
  title: "Features/Book/BookCard",
  component: BookCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    // 카드 한 장 폭. 여러 장을 직접 배치하는 스토리는 parameters.freeWidth로 뺀다
    (Story, { parameters }) =>
      parameters.freeWidth ? (
        <Story />
      ) : (
        <div style={{ width: "200px" }}>
          <Story />
        </div>
      ),
  ],
} satisfies Meta<typeof BookCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 도서 카드 */
export const Default: Story = {
  args: {
    book: mockBook,
  },
};

/** 긴 제목 처리 확인 */
export const LongTitle: Story = {
  args: {
    book: {
      ...mockBook,
      title:
        "아주 긴 제목의 책이 있다면 어떻게 표시될까요? 이런 식으로 매우 긴 제목은 잘림 처리되어야 합니다",
    },
  },
};

/** 스켈레톤 로딩 상태 */
export const Skeleton: Story = {
  render: () => <BookCard.Skeleton />,
  args: {
    book: mockBook,
  },
};

/** 여러 카드 그리드 배치 */
export const Grid: Story = {
  args: {
    book: mockBook,
  },
  decorators: [
    () => (
      <div className="grid grid-cols-3 gap-4" style={{ width: "600px" }}>
        <BookCard book={mockBook} />
        <BookCard
          book={{
            ...mockBook,
            title: "노르웨이의 숲",
            author: "무라카미 하루키",
          }}
        />
        <BookCard
          book={{
            ...mockBook,
            title: "1984",
            author: "조지 오웰",
          }}
        />
      </div>
    ),
  ],
};

/**
 * PC에서 마우스를 올리면 표지가 들리고 포인터 쪽으로 살짝 기운다.
 * 터치·키보드 포커스에는 반응하지 않는다(검색·관련 도서·메인 슬라이더 공통)
 */
export const HoverTilt: Story = {
  args: { book: mockBook },
  parameters: { freeWidth: true },
  decorators: [
    () => (
      <div className="grid w-[min(40rem,calc(100vw-2rem))] grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        {SAMPLE_BOOKS.slice(0, 8).map((b) => (
          <BookCard
            key={b.isbn}
            book={{
              ...mockBook,
              isbn: b.isbn,
              title: b.title,
              author: b.author,
              image: b.image,
            }}
          />
        ))}
      </div>
    ),
  ],
};
