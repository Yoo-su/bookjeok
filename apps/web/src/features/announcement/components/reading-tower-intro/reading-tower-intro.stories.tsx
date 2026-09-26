import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { gaegu } from "@/styles/fonts";

import { ReadingTowerIntro } from "./index";

function Harness() {
  const [open, setOpen] = useState(true);
  // 모달은 body로 포털되므로 앱처럼 html에 손글씨 글꼴 변수를 둔다
  useEffect(() => {
    document.documentElement.classList.add(gaegu.variable);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m-6 rounded-full border px-4 py-2 text-sm"
      >
        다시 열기
      </button>
      <ReadingTowerIntro open={open} onOpenChange={setOpen} />
    </>
  );
}

const meta: Meta<typeof Harness> = {
  title: "Announcement/ReadingTowerIntro",
  component: Harness,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default meta;

/** 비로그인: 예시 46권, 마지막 버튼은 가입 */
export const Guest: StoryObj<typeof Harness> = {};
