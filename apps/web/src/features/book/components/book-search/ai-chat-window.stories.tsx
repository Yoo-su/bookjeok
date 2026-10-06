import { User } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { CHAT_STORAGE_KEY } from "../../constants/ai-chat";
import { AiChatWindow } from "./ai-chat-window";

const mockUser: User = {
  id: 1,
  provider: "local",
  providerId: "1",
  email: "reader@example.com",
  nickname: "애독자너구리",
  handle: "reader_neoguri",
  profileImageUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  isReadingLogPublic: true,
  role: "USER",
  isEmailVerified: true,
};

const mockMessages = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "안녕하세요! 어떤 책을 찾고 계신가요? 마음속 고민이나 읽고 싶은 분위기를 말씀해 주세요.",
  },
  {
    id: "user-1",
    role: "user",
    content:
      "요즘 업무로 너무 피곤하고 지쳐서, 마음을 편안하게 해주는 따뜻한 에세이나 소설을 읽고 싶어.",
  },
  {
    id: "ai-1",
    role: "assistant",
    content:
      "지친 일상에 따뜻한 온기와 휴식을 전해줄 수 있는 도서들을 준비했습니다. 조용한 서사와 위로가 담긴 책들을 둘러보세요.",
    books: [
      {
        isbn: "9788936434267",
        title: "불편한 편의점",
        author: "김호연",
        publisher: "나무옆의의자",
        description:
          "청파동 골목길 작은 편의점에서 일어나는 따뜻하고 유쾌한 인간 삶의 위로와 감동 스토리.",
        image: "https://cdn.bookjeok.com/covers/9788932912363.webp",
        pubdate: "20210420",
        similarity: 0.88,
      },
      {
        isbn: "9788954682152",
        title: "어서 오세요, 휴남동 서점입니다",
        author: "황보름",
        publisher: "클레이하우스",
        description:
          "평범한 동네 서점을 배경으로 일상의 번민을 안고 살아가는 사람들의 연대와 치유 이야기.",
        image: "https://cdn.bookjeok.com/covers/9788932912363.webp",
        pubdate: "20220117",
        similarity: 0.84,
      },
    ],
  },
  {
    id: "user-2",
    role: "user",
    content: "고마워! 이 중에서 밤에 가볍게 읽기 제일 좋은 책은 어떤 거야?",
  },
  {
    id: "ai-2",
    role: "assistant",
    content:
      "**불편한 편의점**을 추천드려요! 부담 없이 술술 읽히는 에피소드 중심이라 잔잔한 감동과 함께 편안한 밤을 만들어 줄 거예요.",
  },
];

const meta = {
  title: "Features/Book/AiChatWindow",
  component: AiChatWindow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AiChatWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 로그인 상태 + 실시간 대화 수신 완료 스토리 */
export const LoggedInWithActiveChat: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useAuthStore.setState({ user: mockUser });
        if (typeof window !== "undefined") {
          const storageKey = `${CHAT_STORAGE_KEY}_user_${mockUser.id}`;
          sessionStorage.setItem(storageKey, JSON.stringify(mockMessages));
        }
      }, []);

      return (
        <div className="max-w-5xl mx-auto p-4 bg-stone-100/50 rounded-3xl">
          <Story />
        </div>
      );
    },
  ],
};

/** 비로그인 유저 상태 스토리 */
export const GuestUser: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useAuthStore.setState({ user: null });
        if (typeof window !== "undefined") {
          const storageKey = `${CHAT_STORAGE_KEY}_guest`;
          sessionStorage.removeItem(storageKey);
        }
      }, []);

      return (
        <div className="max-w-5xl mx-auto p-4 bg-stone-100/50 rounded-3xl">
          <Story />
        </div>
      );
    },
  ],
};
