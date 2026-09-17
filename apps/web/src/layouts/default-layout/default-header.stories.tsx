import type { Meta, StoryObj } from "@storybook/react";

import { DefaultHeader } from "./default-header";

const meta = {
  title: "Layout/DefaultHeader",
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
