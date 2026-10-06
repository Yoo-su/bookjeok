import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { ReadingLogControls, type ReadingLogViewMode } from "./index";

function ControlsPlayground({
  initialMode = "calendar",
}: {
  initialMode?: ReadingLogViewMode;
}) {
  const [mode, setMode] = useState<ReadingLogViewMode>(initialMode);
  const [date, setDate] = useState(new Date(2026, 9, 1));
  return (
    <div className="mx-auto w-full max-w-5xl">
      <ReadingLogControls
        viewMode={mode}
        onViewModeChange={setMode}
        currentDate={date}
        onDateChange={setDate}
        onPrevMonth={() =>
          setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
        }
        onNextMonth={() =>
          setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
        }
      />
    </div>
  );
}

const meta = {
  title: "Features/ReadingLog/ReadingLogControls",
  component: ControlsPlayground,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ControlsPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 달력 · 리스트 · 키재기를 오가면 밑줄이 미끄러져 옮겨 간다 */
export const ViewModes: Story = {};

/** 키재기에서는 월 대신 연도를 고른다 */
export const StackMode: Story = { args: { initialMode: "stack" } };
