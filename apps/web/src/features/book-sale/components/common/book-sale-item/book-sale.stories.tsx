import type { UsedBookSale as UsedBookSaleType } from "@bookjeok/core";
import { SaleStatus } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { UsedBookSale } from "./index";

// 목데이터
const mockSale: UsedBookSaleType = {
  id: 1,
  title: "데미안 - 깨끗한 상태, 거의 새것",
  price: 5000,
  city: "서울",
  district: "강남구",
  content: "한 번 읽고 보관만 했습니다. 깨끗한 상태입니다.",
  imageUrls: ["https://cdn.bookjeok.com/covers/9788932912363.webp"],
  status: SaleStatus.FOR_SALE,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
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
  viewCount: 523,
};

const meta = {
  title: "Feature/UsedBookSale",
  component: UsedBookSale.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "240px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UsedBookSale.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 판매 카드 (전체 파츠 포함) */
export const Default: Story = {
  args: {
    sale: mockSale,
    children: null,
  },
  render: (args) => (
    <UsedBookSale.Root sale={args.sale}>
      <UsedBookSale.Image />
      <UsedBookSale.Content>
        <UsedBookSale.Price />
        <UsedBookSale.Title />
        <UsedBookSale.Location />
        <UsedBookSale.Meta />
      </UsedBookSale.Content>
    </UsedBookSale.Root>
  ),
};

/** 예약 중 상태 */
export const Reserved: Story = {
  args: {
    sale: {
      ...mockSale,
      status: SaleStatus.RESERVED,
      title: "노르웨이의 숲 - 예약 중",
      price: 8000,
    },
    children: null,
  },
  render: (args) => (
    <UsedBookSale.Root sale={args.sale}>
      <UsedBookSale.Image />
      <UsedBookSale.Content>
        <UsedBookSale.Price />
        <UsedBookSale.Title />
        <UsedBookSale.Location />
        <UsedBookSale.Meta />
      </UsedBookSale.Content>
    </UsedBookSale.Root>
  ),
};

/** 판매 완료 상태 */
export const Sold: Story = {
  args: {
    sale: {
      ...mockSale,
      status: SaleStatus.SOLD,
      title: "1984 - 판매 완료",
      price: 3000,
    },
    children: null,
  },
  render: (args) => (
    <UsedBookSale.Root sale={args.sale}>
      <UsedBookSale.Image />
      <UsedBookSale.Content>
        <UsedBookSale.Price />
        <UsedBookSale.Title />
        <UsedBookSale.Location />
        <UsedBookSale.Meta />
      </UsedBookSale.Content>
    </UsedBookSale.Root>
  ),
};

/** 순위 배지 포함 (인기 상품) */
export const WithRank: Story = {
  args: {
    sale: mockSale,
    rank: 1,
    children: null,
  },
  render: (args) => (
    <UsedBookSale.Root sale={args.sale} rank={args.rank}>
      <UsedBookSale.Image />
      <UsedBookSale.Content>
        <UsedBookSale.Price />
        <UsedBookSale.Title />
        <UsedBookSale.Location />
        <UsedBookSale.Meta />
      </UsedBookSale.Content>
    </UsedBookSale.Root>
  ),
};

/** 할인율 표시 (정가 대비 저렴한 가격) */
export const Discounted: Story = {
  args: {
    sale: {
      ...mockSale,
      price: 3000,
      book: { ...mockSale.book, discount: "15000" },
      title: "80% 할인! 거의 새것",
    },
    children: null,
  },
  render: (args) => (
    <UsedBookSale.Root sale={args.sale}>
      <UsedBookSale.Image />
      <UsedBookSale.Content>
        <UsedBookSale.Price />
        <UsedBookSale.Title />
        <UsedBookSale.Location />
        <UsedBookSale.Meta />
      </UsedBookSale.Content>
    </UsedBookSale.Root>
  ),
};

/** 그리드 배치 (마켓 리스트) */
export const Grid: Story = {
  args: {
    sale: mockSale,
    children: null,
  },
  decorators: [
    () => (
      <div className="grid grid-cols-3 gap-4" style={{ width: "720px" }}>
        {[SaleStatus.FOR_SALE, SaleStatus.RESERVED, SaleStatus.SOLD].map(
          (status, i) => (
            <UsedBookSale.Root
              key={status}
              sale={{
                ...mockSale,
                id: i + 1,
                status,
                title: `${status === SaleStatus.FOR_SALE ? "판매 중" : status === SaleStatus.RESERVED ? "예약 중" : "판매 완료"} 도서`,
                price: 5000 + i * 3000,
              }}
              rank={i + 1}
            >
              <UsedBookSale.Image />
              <UsedBookSale.Content>
                <UsedBookSale.Price />
                <UsedBookSale.Title />
                <UsedBookSale.Location />
                <UsedBookSale.Meta />
              </UsedBookSale.Content>
            </UsedBookSale.Root>
          ),
        )}
      </div>
    ),
  ],
};

/** 스켈레톤 로딩 */
export const Skeleton: Story = {
  args: {
    sale: mockSale,
    children: null,
  },
  render: () => <UsedBookSale.Skeleton />,
};
