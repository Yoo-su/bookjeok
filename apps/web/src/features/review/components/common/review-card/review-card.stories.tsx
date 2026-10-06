import type { Review } from "@bookjeok/core";
import { ReviewReactionType } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { ReviewCard } from "./index";

// 목데이터
const mockReview: Review = {
  id: 1,
  title: "인생을 바꾼 한 권의 책",
  content:
    "<p>이 책은 정말 대단합니다. 읽는 내내 깊은 감동을 받았고, 삶에 대한 새로운 시각을 갖게 되었습니다.</p>",
  isbn: "9788937460784",
  rating: 4.5,
  tags: ["성장", "고전문학", "인생책"],
  category: "소설",
  viewCount: 1234,
  userId: 1,
  isPublic: true,
  reactionCount: 42,
  reactionCounts: {
    [ReviewReactionType.LIKE]: 20,
    [ReviewReactionType.INSIGHTFUL]: 15,
    [ReviewReactionType.SUPPORT]: 7,
  },
  user: {
    id: 1,
    handle: "bookworm",
    nickname: "책벌레",
    profileImageUrl: "default_profile3",
  },
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
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
};

const meta = {
  title: "Features/Review/ReviewCard",
  component: ReviewCard.Root,
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
} satisfies Meta<typeof ReviewCard.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 리뷰 카드 */
export const Default: Story = {
  args: {
    review: mockReview,
  },
  render: (args) => (
    <ReviewCard.Root {...args}>
      <ReviewCard.Image />
      <ReviewCard.Content>
        <ReviewCard.Meta />
        <ReviewCard.Title />
        <ReviewCard.Tags />
        <ReviewCard.Action />
      </ReviewCard.Content>
    </ReviewCard.Root>
  ),
};

/** 높은 별점 리뷰 */
export const HighRating: Story = {
  args: {
    review: {
      ...mockReview,
      rating: 5,
      title: "완벽한 작품! 다섯 개 만점 ★★★★★",
    },
  },
  render: (args) => (
    <ReviewCard.Root {...args}>
      <ReviewCard.Image />
      <ReviewCard.Content>
        <ReviewCard.Meta />
        <ReviewCard.Title />
        <ReviewCard.Tags />
        <ReviewCard.Action />
      </ReviewCard.Content>
    </ReviewCard.Root>
  ),
};

/** 비공개 리뷰 */
export const Private: Story = {
  args: {
    review: {
      ...mockReview,
      isPublic: false,
      title: "나만의 독서 기록",
    },
  },
  render: (args) => (
    <ReviewCard.Root {...args}>
      <ReviewCard.Image />
      <ReviewCard.Content>
        <ReviewCard.Meta />
        <ReviewCard.Title />
        <ReviewCard.Tags />
        <ReviewCard.Action />
      </ReviewCard.Content>
    </ReviewCard.Root>
  ),
};

/** 수정/삭제 액션 포함 (마이페이지용) */
export const WithActions: Story = {
  args: {
    review: mockReview,
  },
  render: (args) => (
    <ReviewCard.Root {...args}>
      <ReviewCard.Image />
      <ReviewCard.Content>
        <ReviewCard.Meta />
        <ReviewCard.Title />
        <ReviewCard.Tags />
        <ReviewCard.Action
          onEdit={() => alert("수정 클릭")}
          onDelete={() => alert("삭제 클릭")}
        />
      </ReviewCard.Content>
    </ReviewCard.Root>
  ),
};

/** 태그 없는 리뷰 */
export const NoTags: Story = {
  args: {
    review: {
      ...mockReview,
      tags: [],
      title: "태그 없는 간단 리뷰",
    },
  },
  render: (args) => (
    <ReviewCard.Root {...args}>
      <ReviewCard.Image />
      <ReviewCard.Content>
        <ReviewCard.Meta />
        <ReviewCard.Title />
        <ReviewCard.Tags />
        <ReviewCard.Action />
      </ReviewCard.Content>
    </ReviewCard.Root>
  ),
};

/** 여러 카드 리스트 */
export const List: Story = {
  args: {
    review: mockReview,
  },
  decorators: [
    () => (
      <div className="grid grid-cols-1 gap-4" style={{ width: "480px" }}>
        <ReviewCard.Root review={mockReview}>
          <ReviewCard.Image />
          <ReviewCard.Content>
            <ReviewCard.Meta />
            <ReviewCard.Title />
            <ReviewCard.Tags />
            <ReviewCard.Action />
          </ReviewCard.Content>
        </ReviewCard.Root>

        <ReviewCard.Root
          review={{
            ...mockReview,
            id: 2,
            title: "두 번째 리뷰: 깊이 있는 통찰",
            rating: 4,
            tags: ["경제", "자기계발"],
            user: {
              ...mockReview.user,
              nickname: "독서광",
            },
          }}
        >
          <ReviewCard.Image />
          <ReviewCard.Content>
            <ReviewCard.Meta />
            <ReviewCard.Title />
            <ReviewCard.Tags />
            <ReviewCard.Action />
          </ReviewCard.Content>
        </ReviewCard.Root>

        <ReviewCard.Root
          review={{
            ...mockReview,
            id: 3,
            title: "세 번째 리뷰",
            rating: 3.5,
            isPublic: false,
          }}
        >
          <ReviewCard.Image />
          <ReviewCard.Content>
            <ReviewCard.Meta />
            <ReviewCard.Title />
            <ReviewCard.Tags />
            <ReviewCard.Action />
          </ReviewCard.Content>
        </ReviewCard.Root>
      </div>
    ),
  ],
};
