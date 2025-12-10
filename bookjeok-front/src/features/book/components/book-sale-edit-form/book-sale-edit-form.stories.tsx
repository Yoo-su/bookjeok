import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { useAuthStore } from "../../../auth/store";
import { SaleStatus, UsedBookSale } from "../../types";
import { BookSaleEditForm } from "./index";

const meta: Meta<typeof BookSaleEditForm> = {
  title: "Features/Book/BookSaleEditForm",
  component: BookSaleEditForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    sale: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof BookSaleEditForm>;

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
  viewCount: 123,
};

const mockUser = {
  id: 1,
  nickname: "Test User",
  email: "test@example.com",
  provider: "google",
  providerId: "mock-provider-id",
  profileImageUrl: "https://placehold.co/100x100",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const Default: Story = {
  args: {
    sale: mockSale,
  },
  decorators: [
    (Story) => {
      useAuthStore.setState({ user: mockUser });
      return (
        <div style={{ width: "800px" }}>
          <Story />
        </div>
      );
    },
  ],
};
