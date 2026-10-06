import type { User } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { WishlistButton } from "./index";

const meta = {
  title: "Features/User/WishlistButton",
  component: WishlistButton,
  parameters: { layout: "centered" },
  args: { type: "BOOK", id: "9788932003979", initialIsWishlisted: false },
  beforeEach: () => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
  },
} satisfies Meta<typeof WishlistButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 찜할 때만 하트 둘레로 점이 퍼지고, 해제할 때는 조용히 꺼진다.
 * 서버가 없어 요청이 실패하면 원래 상태로 되돌아간다
 */
export const Default: Story = {};

/** 도서 상세처럼 테두리 있는 넓은 버튼 안에서 점이 잘리지 않는지 */
export const InBookDetail: Story = {
  args: {
    className:
      "w-14 sm:w-auto border border-input bg-background hover:bg-accent h-11 sm:px-8 rounded-md",
  },
};

export const LoggedOut: Story = {
  beforeEach: () => {
    useAuthStore.setState({ user: null });
  },
};
