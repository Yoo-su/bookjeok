import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { AnimatedHeart } from "@/shared/components/icons/animated";

import { Burst } from "./burst";
import { RollingNumber } from "./rolling-number";

const meta = {
  title: "Shared/UI/Burst",
  component: Burst,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Burst>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 좋아요를 켤 때만 점이 퍼지고, 끌 때는 조용히 꺼진다 */
export const LikeToggle: Story = {
  render: () => {
    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState(41);
    const [burstKey, setBurstKey] = useState<number | null>(null);
    return (
      <button
        type="button"
        aria-pressed={liked}
        onClick={() => {
          if (!liked) setBurstKey(Date.now());
          setLiked(!liked);
          setCount((n) => n + (liked ? -1 : 1));
        }}
        className="flex items-center gap-2 text-sm text-stone-700"
      >
        <span className="relative inline-flex size-9 items-center justify-center">
          <AnimatedHeart
            size={24}
            animate={liked}
            animateOnHover
            className={liked ? "fill-red-500 text-red-500" : "text-stone-400"}
            aria-hidden="true"
          />
          {burstKey !== null && (
            <Burst key={burstKey} className="text-red-500" particles={6} />
          )}
        </span>
        <RollingNumber value={count} />
      </button>
    );
  },
};
