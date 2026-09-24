import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MarkAsReadButton } from "./index";

const meta: Meta<typeof MarkAsReadButton> = {
  title: "ReadingLog/MarkAsReadButton",
  component: MarkAsReadButton,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <div className="p-8">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    book: {
      isbn: "9791193078376",
      title: "급류",
      author: "정대건",
      image: "/images/season/fall1.jpg",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkAsReadButton>;

export const Default: Story = {};
