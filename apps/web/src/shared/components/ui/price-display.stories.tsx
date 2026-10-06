import type { Meta, StoryObj } from "@storybook/react";

import { PriceDisplay } from "./price-display";

const meta = {
  title: "Shared/UI/PriceDisplay",
  component: PriceDisplay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "number",
      description: "표시할 금액",
    },
    currency: {
      control: "text",
      description: '통화 코드 (기본: "KRW")',
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "텍스트 크기",
    },
  },
} satisfies Meta<typeof PriceDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 가격 표시 */
export const Default: Story = {
  args: {
    value: 15000,
  },
};

/** 작은 사이즈: 목록 아이템 */
export const Small: Story = {
  args: {
    value: 8500,
    size: "sm",
  },
};

/** 큰 사이즈: 상세 페이지 */
export const Large: Story = {
  args: {
    value: 25000,
    size: "lg",
  },
};

/** 초대형: 히어로 섹션 */
export const ExtraLarge: Story = {
  args: {
    value: 120000,
    size: "xl",
  },
};

/** 다양한 가격대 비교 */
export const PriceComparison: Story = {
  args: {
    value: 0,
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">저렴한 도서:</span>
        <PriceDisplay value={5000} size="sm" />
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">일반 도서:</span>
        <PriceDisplay value={18000} size="md" />
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm text-muted-foreground">고가 도서:</span>
        <PriceDisplay value={55000} size="lg" />
      </div>
    </div>
  ),
};
