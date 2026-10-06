import "./search-hero-tokens.css";

import type { Meta, StoryObj } from "@storybook/react";

import { BookSearchInput } from "./book-search-input";
import styles from "./search-hero.module.css";

const meta = {
  title: "Features/Book/BookSearchInput",
  component: BookSearchInput,
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  decorators: [
    // 검색 첫 화면과 같은 색 토큰·폭 안에 둔다
    (Story) => (
      <div className="search-video-hero bg-stone-900 p-6">
        <div className={styles.form}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: { variant: "hero" },
} satisfies Meta<typeof BookSearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 글자를 넣으면 X가 돌며 나타나고, 다 지우거나 X를 누르면 반대로 돌며 사라진다. X를 누르면 입력에 포커스가 돌아온다 */
export const ClearButton: Story = {};
