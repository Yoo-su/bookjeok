import { readingLogKeys, type User } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { sampleReceivedKongs } from "@/features/reading-log/components/kong/lib/sample-kongs";

import { DefaultHeader } from "./default-header";

const meta = {
  title: "Layouts/DefaultHeader",
  component: DefaultHeader,
  parameters: {
    layout: "fullscreen",
    // LanguageSwitcher와 i18n 라우팅이 App Router 훅을 쓴다.
    // pathname을 주는 것은 활성 메뉴의 손그림 스프링 밑줄을 보기 위해서다.
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/ko/book/search" },
    },
  },
} satisfies Meta<typeof DefaultHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 스크롤 반응을 보기 위한 스토리.
 * 300px을 넘기면 알약이 max-w-5xl에서 max-w-7xl로 넓어지고 그림자가 짙어진다.
 */
export const ScrollToExpand: Story = {
  render: () => (
    <div className="min-h-[240vh] bg-stone-50">
      <DefaultHeader />
      <main className="mx-auto max-w-5xl p-6">
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="py-4 text-stone-400">
            본문 {i + 1} — 스크롤을 내리면 헤더 알약이 넓어집니다.
          </p>
        ))}
      </main>
    </div>
  ),
};

/**
 * 1024~1279px에서는 데스크톱 내비게이션과 우측 액션이 함께 노출된다.
 * 이 구간의 BGM 진입점은 아이콘만 남아 메뉴와 붙지 않아야 한다.
 */
export const TightDesktop: Story = {
  ...ScrollToExpand,
  parameters: {
    ...meta.parameters,
    viewport: {
      viewports: {
        tightDesktop: {
          name: "Tight desktop",
          styles: { width: "1062px", height: "800px" },
        },
      },
      defaultViewport: "tightDesktop",
    },
  },
};

/** 로그인하면 알림·사용자 메뉴가 선다. 로컬에 API가 없어 알림은 빈 채로 둔다 */
export const LoggedIn: Story = {
  ...ScrollToExpand,
  beforeEach: () => {
    useAuthStore.setState({
      user: {
        id: 1,
        nickname: "미리보기",
        handle: "preview",
        profileImageUrl: null,
      } as unknown as User,
    });
  },
};

/** 받은 콩이 있으면 사용자 메뉴 「독서 기록」 옆에 작게 수를 붙인다. 열린 채로 시작한다 */
export const LoggedInWithKongs: Story = {
  ...LoggedIn,
  decorators: [
    (Story) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      });
      client.setQueryData(
        readingLogKeys.kongsReceived.queryKey,
        sampleReceivedKongs([5, 4, 3]),
      );
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const avatar = await within(canvasElement).findByText("미리");
    await userEvent.click(avatar);
  },
};

/**
 * 데스크톱 메뉴(1280).
 * - 메뉴에 마우스를 올리면 흐린 손그림 밑줄이 그어지고, 떼면 거꾸로 되감겨 지워진다
 * - 챕터 번호가 살짝 들린다
 * - 리뷰·중고마켓을 펼치면 ▾가 뒤집히고 항목이 한 줄씩 내려앉는다. 펼친 동안 밑줄은 남는다
 * - 현재 메뉴(도서 검색)의 진한 밑줄은 처음에 한 번 그어진다
 */
export const ChapterNavigation: Story = {
  ...ScrollToExpand,
  parameters: {
    ...meta.parameters,
    viewport: { defaultViewport: "desktop" },
  },
};

/**
 * 모바일 메뉴(375). 열린 채로 시작한다. 닫았다 다시 열면 다시 볼 수 있다.
 * - 시트가 들어오는 동안 섹션과 항목이 한 박자씩 늦게 따라 들어온다
 * - 항목이 다 들어온 뒤 현재 메뉴(라운지)에 형광펜이 그어진다
 * - 항목과 햄버거 버튼을 누르는 동안 살짝 눌려 들어간다
 */
export const MobileMenu: Story = {
  ...ScrollToExpand,
  parameters: {
    ...meta.parameters,
    nextjs: { appDirectory: true, navigation: { pathname: "/ko/lounge" } },
    viewport: { defaultViewport: "mobile" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "메뉴 열기" }));
  },
};
