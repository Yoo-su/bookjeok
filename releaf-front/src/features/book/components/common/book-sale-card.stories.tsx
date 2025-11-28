import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SaleStatus, UsedBookSale } from "../../types";
import { BookSaleCard } from "./book-sale-card";

const meta: Meta<typeof BookSaleCard> = {
  title: "Features/Book/Common/BookSaleCard",
  component: BookSaleCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    sale: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof BookSaleCard>;

const mockSale: UsedBookSale = {
  id: 1,
  title: "깊이에의 강요",
  price: 12000,
  city: "서울특별시",
  district: "강남구",
  content: "상태 아주 좋습니다. 직거래 선호합니다.",
  imageUrls: ["https://placehold.co/600x400/png"],
  status: SaleStatus.FOR_SALE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: {
    id: 1,
    nickname: "독서왕",
    profileImageUrl: "https://placehold.co/100x100/png",
  },
  book: {
    title: "깊이에의 강요",
    link: "https://example.com",
    image: "https://placehold.co/300x400/png",
    author: "파트리크 쥐스킨트",
    discount: "0",
    publisher: "열린책들",
    pubdate: "20200420",
    isbn: "9788932920238",
    description: "설명",
  },
};

export const Default: Story = {
  args: {
    sale: mockSale,
    idx: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Reserved: Story = {
  args: {
    sale: {
      ...mockSale,
      status: SaleStatus.RESERVED,
    },
    idx: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

export const SoldOut: Story = {
  args: {
    sale: {
      ...mockSale,
      status: SaleStatus.SOLD,
    },
    idx: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};
export const CustomStyle: Story = {
  args: {
    sale: mockSale,
    className: "w-[400px] border-2 border-primary",
  },
};

export const NoEffect: Story = {
  args: {
    sale: mockSale,
    showEffect: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};
