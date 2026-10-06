import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { RollingNumber } from "./rolling-number";

const meta = {
  title: "Shared/UI/RollingNumber",
  component: RollingNumber,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RollingNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 늘면 아래에서 올라오고 줄면 위에서 내려온다. 바뀐 자리만 움직인다 */
export const Interactive: Story = {
  args: { value: 0 },
  render: () => {
    const [value, setValue] = useState(9);
    return (
      <div className="flex flex-col items-center gap-4">
        <RollingNumber
          value={value}
          format={(n) => n.toLocaleString("ko-KR")}
          className="text-4xl font-bold text-stone-900"
        />
        <div className="flex gap-2 text-xs">
          {[-10, -1, 1, 10, 991].map((step) => (
            <button
              key={step}
              type="button"
              className="rounded border px-2 py-1"
              onClick={() => setValue((n) => Math.max(0, n + step))}
            >
              {step > 0 ? `+${step}` : step}
            </button>
          ))}
        </div>
      </div>
    );
  },
};
