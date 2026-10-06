import { privateApiClient } from "@bookjeok/api-client";
import type { ReadingStackBook, User } from "@bookjeok/core";
import type { Meta, StoryObj } from "@storybook/react";
import type { AxiosAdapter } from "axios";
import type { ComponentProps } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Toaster } from "@/shared/components/shadcn/sonner";

import { useStackSettingsStore } from "../../../stores/use-stack-settings-store";
import { stackMilestone } from "../../stack-view/lib/collection";
import { SAMPLE_BOOKS } from "../../stack-view/lib/sample-books";
import { StackMilestoneHost } from "../../stack-view/stack-milestone-host";
import { MarkAsReadButton } from "./index";

const USER_MM = 1730;

/** 마지막 권이 사물·몸 부위를 넘는지(milestone)에 맞춰 예시 책을 앞에서부터 자른다 */
const stackUntil = (milestone: boolean): ReadingStackBook[] => {
  let sum = 0;
  for (let i = 0; i < SAMPLE_BOOKS.length; i++) {
    sum += SAMPLE_BOOKS[i].depth;
    const hit = stackMilestone(sum - SAMPLE_BOOKS[i].depth, sum, USER_MM);
    if (i > 0 && !!hit === milestone) return SAMPLE_BOOKS.slice(0, i + 1);
  }
  return SAMPLE_BOOKS;
};

/** 로컬에 API가 없어 기록 저장·이력·쌓은 책 요청을 받는 어댑터를 갈아 끼움 */
const fakeAdapter =
  (stack: ReadingStackBook[]): AxiosAdapter =>
  async (config) => {
    await new Promise((r) => setTimeout(r, 400));
    const last = stack[stack.length - 1];
    const data =
      config.method === "post"
        ? {
            id: last.logId,
            userId: 1,
            isbn: last.isbn,
            book: { isbn: last.isbn, title: last.title, image: last.image },
            date: last.date,
            memo: "",
            createdAt: last.date,
            updatedAt: last.date,
          }
        : config.url === "/reading-logs/stack"
          ? { year: 2026, items: stack }
          : { count: 0, lastDate: null };
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };

type Args = ComponentProps<typeof MarkAsReadButton> & {
  milestone: boolean;
};

const meta: Meta<Args> = {
  title: "Features/ReadingLog/MarkAsReadButton",
  parameters: { nextjs: { appDirectory: true } },
  render: ({ milestone: _milestone, ...props }) => (
    <div className="p-8">
      <MarkAsReadButton {...props} />
      <StackMilestoneHost />
      <Toaster position="bottom-center" />
    </div>
  ),
  args: {
    milestone: false,
    book: {
      isbn: "9791193078376",
      title: "급류",
      author: "정대건",
      image: "/images/season/fall1.jpg",
    },
  },
  beforeEach: ({ args }) => {
    useAuthStore.setState({
      user: { id: 1, nickname: "미리보기" } as unknown as User,
    });
    useStackSettingsStore.setState({ heightCm: 173, character: "M" });
    const original = privateApiClient.defaults.adapter;
    privateApiClient.defaults.adapter = fakeAdapter(stackUntil(args.milestone));
    return () => {
      privateApiClient.defaults.adapter = original;
    };
  },
};

export default meta;
type Story = StoryObj<Args>;

/** 저장하면 폼이 닫히고 아이콘이 잠깐 체크로 그려졌다가 책으로 돌아온다 */
export const PlainSave: Story = {};

/** 사물·키를 넘은 기록은 장면이 축하하므로 버튼은 체크 없이 조용하다 */
export const MilestoneSave: Story = { args: { milestone: true } };

/** 비로그인은 로그인 화면으로 보낸다 */
export const LoggedOut: Story = {
  beforeEach: () => {
    useAuthStore.setState({ user: null });
  },
};
