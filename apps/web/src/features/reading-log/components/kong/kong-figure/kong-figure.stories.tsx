import type { Meta, StoryObj } from "@storybook/react";

import { gaegu } from "@/styles/fonts";

import { type KongReaction, useKongFlail } from "../hooks/use-kong-flail";
import type { KongFace } from "../lib/kong-art";
import { FlailingKong } from "./flailing-kong";
import { KongFigure } from "./index";

const meta: Meta<typeof KongFigure> = {
  title: "Features/ReadingLog/Kong/KongFigure",
  component: KongFigure,
  parameters: { layout: "centered" },
  args: { size: 160, face: "smile", limbs: "none", boil: true },
};

export default meta;
type Story = StoryObj<typeof KongFigure>;

export const Default: Story = {};

const FACES: KongFace[] = ["smile", "squeeze", "sleep", "joy", "shiver"];
const SIZES = [160, 64, 40, 32, 20, 14];

/** 표정을 크기별로. 40px 아래에선 눈썹을 빼고, 점눈은 1px 아래로 줄지 않는다 */
export const Faces: Story = {
  render: () => (
    <div className="grid gap-6">
      {FACES.map((face) => (
        <div key={face} className="flex items-end gap-5">
          <span className="w-16 text-xs text-stone-500">{face}</span>
          {SIZES.map((size) => (
            <KongFigure key={size} size={size} face={face} boil={size >= 40} />
          ))}
        </div>
      ))}
    </div>
  ),
};

function Poke({ size }: { size: number }) {
  const flail = useKongFlail();
  return (
    <button
      type="button"
      onClick={flail.poke}
      className="cursor-pointer rounded-2xl p-2"
    >
      <FlailingKong size={size} flail={flail} boil={size >= 56} />
    </button>
  );
}

/** 누르면 바둥·부르르·콩 점프 중 하나. 같은 동작은 연달아 나오지 않는다 */
export const Flail: Story = {
  render: () => (
    <div className={`${gaegu.variable} grid justify-items-center gap-2`}>
      <div className="flex items-end gap-6">
        {[160, 56, 34, 20].map((size) => (
          <Poke key={size} size={size} />
        ))}
      </div>
      <p className="font-[family-name:var(--font-gaegu)] text-stone-400">
        콩을 눌러 보세요
      </p>
    </div>
  ),
};

/** 바둥 두 프레임 · 점프 중 만세 · 부르르 떨림 선 */
export const Limbs: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <KongFigure size={160} face="squeeze" limbs="flail0" />
      <KongFigure size={160} face="squeeze" limbs="flail1" />
      <KongFigure size={160} face="joy" limbs="cheer" />
      <KongFigure size={160} face="shiver" limbs="brr" />
    </div>
  ),
};

const REACTION_LABEL: Record<KongReaction, string> = {
  flail: "바둥",
  shiver: "부르르",
  hop: "콩 점프",
};

function ReactionPicker({ size }: { size: number }) {
  const flail = useKongFlail();
  return (
    <div className="grid justify-items-center gap-3">
      <FlailingKong size={size} flail={flail} boil={size >= 56} />
      <div className="flex gap-2">
        {(Object.keys(REACTION_LABEL) as KongReaction[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => flail.play(r)}
            className="cursor-pointer rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600 hover:bg-stone-50"
          >
            {REACTION_LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 반응을 하나씩 골라 본다. 큰 콩(「콩이란?」)과 작은 콩(종지·기록 줄) */
export const Reactions: Story = {
  render: () => (
    <div className="flex items-end gap-10 pt-16">
      <ReactionPicker size={140} />
      <ReactionPicker size={38} />
    </div>
  ),
};
