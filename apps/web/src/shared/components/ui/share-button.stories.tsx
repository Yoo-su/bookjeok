import type { Meta, StoryObj } from "@storybook/react";

import { ShareButton } from "./share-button";

const meta = {
  title: "Shared/UI/ShareButton",
  component: ShareButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "공유할 콘텐츠 제목",
    },
    description: {
      control: "text",
      description: "공유할 콘텐츠 설명",
    },
    showLabel: {
      control: "boolean",
      description: '"공유하기" 라벨 표시 여부',
    },
  },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 아이콘 버튼 */
export const Default: Story = {
  args: {
    title: "데미안 - 헤르만 헤세",
    description: "인생을 바꾼 한 권의 책 리뷰",
  },
};

/** 라벨 포함 버튼 */
export const WithLabel: Story = {
  args: {
    title: "데미안 - 헤르만 헤세",
    description: "인생을 바꾼 한 권의 책 리뷰",
    showLabel: true,
  },
};

/** 커스텀 URL 지정 */
export const CustomUrl: Story = {
  args: {
    title: "북적 - 도서 커뮤니티",
    description: "책과 함께하는 생활을 시작하세요",
    url: "https://bookjeok.vercel.app",
    showLabel: true,
  },
};
