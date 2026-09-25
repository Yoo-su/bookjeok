import type { Meta, StoryObj } from "@storybook/react";
import { format } from "date-fns";

import { ReadingLogFormDialog } from "./index";

const meta: Meta<typeof ReadingLogFormDialog> = {
  title: "ReadingLog/ReadingLogFormDialog",
  component: ReadingLogFormDialog,
  args: {
    book: {
      title: "급류",
      author: "정대건",
      image: "/images/season/fall1.jpg",
    },
    initialDate: format(new Date(), "yyyy-MM-dd"),
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReadingLogFormDialog>;

export const Create: Story = {
  args: { mode: "create" },
};

export const LoggedBefore: Story = {
  args: { mode: "create", bookStatus: { count: 2, lastDate: "2026-03-12" } },
};

export const LoggedSameDay: Story = {
  args: {
    mode: "create",
    bookStatus: { count: 1, lastDate: format(new Date(), "yyyy-MM-dd") },
  },
};

export const Edit: Story = {
  args: {
    mode: "edit",
    initialDate: "2026-08-17",
    initialMemo: "문장이 물살처럼 빠르게 읽혔다.",
  },
};
