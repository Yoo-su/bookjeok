import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { FilterTabs } from "./filter-tabs";

const meta = {
  title: "Shared/UI/FilterTabs",
  component: FilterTabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FilterTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 찜 목록처럼 개수가 붙는 탭. 「하나 빼기」로 개수가 굴러 내려가는 것을 본다 */
export const WithCounts: Story = {
  args: { tabs: [], value: "ALL", onChange: () => {} },
  render: () => {
    const [value, setValue] = useState("ALL");
    const [books, setBooks] = useState(12);
    const [sales, setSales] = useState(3);
    return (
      <div className="space-y-4">
        <FilterTabs
          tabs={[
            { key: "ALL", label: "전체", count: books + sales },
            { key: "BOOK", label: "도서", count: books },
            { key: "SALE", label: "중고거래", count: sales },
          ]}
          value={value}
          onChange={setValue}
        />
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => setBooks((n) => Math.max(0, n - 1))}
          >
            도서 하나 빼기
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => setSales((n) => n + 1)}
          >
            중고 하나 더하기
          </button>
        </div>
      </div>
    );
  },
};

/** 구매 내역처럼 탭이 많아 좁은 화면에서 가로로 넘치는 경우 */
export const Overflowing: Story = {
  args: { tabs: [], value: "ALL", onChange: () => {} },
  render: () => {
    const [value, setValue] = useState("ALL");
    return (
      <FilterTabs
        tabs={[
          { key: "ALL", label: "전체" },
          { key: "AWAITING_PAYMENT", label: "결제 대기" },
          { key: "PAID", label: "결제 완료" },
          { key: "SHIPPED", label: "배송 중" },
          { key: "DELIVERED", label: "배송 완료" },
          { key: "CONFIRMED", label: "구매 확정" },
          { key: "CANCELLED", label: "취소/분쟁" },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};
