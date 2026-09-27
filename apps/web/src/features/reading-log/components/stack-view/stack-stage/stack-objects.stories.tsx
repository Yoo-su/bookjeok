import type { Meta, StoryObj } from "@storybook/react";

import { buildFigure, buildObject } from "../lib/figure";
import { OBJECT_ART } from "../lib/objects";
import { STACK_OBJECTS } from "../lib/objects";
import { SceneNodes } from "../lib/scene-svg";
import type { SceneColors, StackObject } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};
const HELD = "#3F6E8C";
const PAD = 14;

/** 사물 하나. 무대와 같은 0~1000 단위를 height px에 맞춘다 */
function ObjectFigure({
  object,
  height,
  boil,
}: {
  object: StackObject;
  height: number;
  boil: boolean;
}) {
  const k = height / 1000;
  const [x0, x1] = OBJECT_ART[object].x;
  const items = buildObject({
    fx: PAD - x0 * k,
    fy: PAD,
    k,
    colors: COLORS,
    u: 1,
    object,
    heldColor: HELD,
    boil,
  });
  return (
    <figure className="m-0 grid justify-items-center gap-1">
      <svg
        width={(x1 - x0) * k + PAD * 2}
        height={height + PAD * 2 + 8}
        className="overflow-visible"
      >
        <SceneNodes items={items} />
      </svg>
      <figcaption className="text-xs text-stone-500">{object}</figcaption>
    </figure>
  );
}

function Gallery({
  height,
  boil,
  withReader,
}: {
  height: number;
  boil: boolean;
  withReader?: boolean;
}) {
  const k = height / 1000;
  return (
    <div className="flex flex-wrap items-end gap-8 bg-white p-6">
      {withReader && (
        <figure className="m-0 grid justify-items-center gap-1">
          <svg
            width={300 * k + PAD * 2}
            height={height + PAD * 2 + 8}
            className="overflow-visible"
          >
            <SceneNodes
              items={buildFigure({
                fx: PAD,
                fy: PAD,
                k,
                colors: COLORS,
                u: 1,
                mood: "happy",
                character: "F",
                heldColor: HELD,
                boil,
              })}
            />
          </svg>
          <figcaption className="text-xs text-stone-500">F</figcaption>
        </figure>
      )}
      {STACK_OBJECTS.map((o) => (
        <ObjectFigure key={o.id} object={o.id} height={height} boil={boil} />
      ))}
    </div>
  );
}

const meta: Meta<typeof Gallery> = {
  title: "ReadingLog/StackObjects",
  component: Gallery,
  args: { height: 360, boil: true },
};

export default meta;
type Story = StoryObj<typeof Gallery>;

/** 기본 캐릭터와 나란히 두고 선 굵기·톤을 비교한다 */
export const Lineup: Story = { args: { withReader: true } };
/** 크게 보고 세부를 다듬는다 */
export const Large: Story = { args: { height: 640, boil: false } };
/** 모바일 무대에서 작게 그려질 때 */
export const Small: Story = { args: { height: 110, boil: false } };
