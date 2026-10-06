import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { StarRating } from "./star-rating";

const meta = {
  title: "Shared/UI/StarRating",
  component: StarRating,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "number", min: 0, max: 5, step: 0.5 },
      description: "현재 별점 값 (0~5, 0.5 단위)",
    },
    size: {
      control: { type: "number", min: 16, max: 48 },
      description: "별 아이콘 크기 (px)",
    },
    readonly: {
      control: "boolean",
      description: "읽기 전용 모드",
    },
    disabled: {
      control: "boolean",
      description: "비활성화 상태",
    },
  },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 별점 입력 */
export const Default: Story = {
  args: {
    value: 3.5,
    size: 24,
  },
};

/** 읽기 전용: 리뷰 목록에서 별점 표시 시 사용 */
export const Readonly: Story = {
  args: {
    value: 4.5,
    readonly: true,
    size: 20,
  },
};

/** 비활성화 상태: 폼 전송 중 등 */
export const Disabled: Story = {
  args: {
    value: 2,
    disabled: true,
  },
};

/** 빈 별점 */
export const Empty: Story = {
  args: {
    value: 0,
  },
};

/** 만점 */
export const FullScore: Story = {
  args: {
    value: 5,
    readonly: true,
  },
};

/** 큰 사이즈: 상세 페이지용 */
export const Large: Story = {
  args: {
    value: 4,
    size: 40,
    readonly: true,
  },
};

/**
 * 인터랙티브 데모. 값이 오르면 앞 별부터 하나씩 차오르고 누른 별이 통 튄다.
 * 내릴 때는 바로 비운다. 화살표 키로 바꿔도 같다
 */
export const Interactive: Story = {
  args: {
    value: 0,
  },
  render: () => {
    const [rating, setRating] = useState(0);
    return (
      <div className="flex flex-col items-center gap-4">
        <StarRating value={rating} onChange={setRating} size={32} />
        <p className="text-sm text-muted-foreground">
          선택한 별점: {rating.toFixed(1)}
        </p>
      </div>
    );
  },
};
