import type { Meta, StoryObj } from "@storybook/react";

import { gaegu } from "@/styles/fonts";

import { useKongFlail } from "../hooks/use-kong-flail";
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

const FACES: KongFace[] = ["smile", "squeeze", "sleep"];
const SIZES = [160, 64, 40, 32, 20, 14];

/** 표정 셋을 크기별로. 40px 아래에선 눈썹을 빼고, 점눈은 1px 아래로 줄지 않는다 */
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
      onClick={flail.flail}
      className="cursor-pointer rounded-2xl p-2"
    >
      <FlailingKong size={size} flail={flail} boil={size >= 56} />
    </button>
  );
}

/** 누르면 팔다리를 꺼내 바둥거린다 */
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

/** 바둥거리는 두 프레임 */
export const Limbs: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <KongFigure size={160} face="squeeze" limbs="flail0" />
      <KongFigure size={160} face="squeeze" limbs="flail1" />
    </div>
  ),
};
