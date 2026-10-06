import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Pagination } from "./pagination";

const meta = {
  title: "Shared/UI/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    currentPage: {
      control: { type: "number", min: 1 },
      description: "현재 페이지",
    },
    totalPages: {
      control: { type: "number", min: 1 },
      description: "전체 페이지 수",
    },
    maxVisiblePages: {
      control: { type: "number", min: 3, max: 10 },
      description: "표시할 최대 페이지 번호 수",
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본: 중간 페이지 */
export const Default: Story = {
  args: {
    currentPage: 5,
    totalPages: 20,
    onPageChange: () => {},
  },
};

/** 첫 페이지 */
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
};

/** 마지막 페이지 */
export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    onPageChange: () => {},
  },
};

/** 페이지 적을 때 (생략 없음) */
export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    onPageChange: () => {},
  },
};

/** 1페이지뿐일 때 (숨김 처리) */
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    onPageChange: () => {},
  },
};

/** 인터랙티브 데모: 실제 페이지 이동 */
export const Interactive: Story = {
  args: {
    currentPage: 1,
    totalPages: 15,
    onPageChange: () => {},
  },
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <div className="flex flex-col items-center gap-4">
        <Pagination currentPage={page} totalPages={15} onPageChange={setPage} />
        <p className="text-sm text-muted-foreground">현재 페이지: {page}</p>
      </div>
    );
  },
};
