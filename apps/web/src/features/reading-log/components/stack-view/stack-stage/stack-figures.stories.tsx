import type { Meta, StoryObj } from "@storybook/react";

import { STACK_AUTHOR_IDS } from "../lib/authors";
import { buildFigure } from "../lib/figure";
import { SceneNodes } from "../lib/scene-svg";
import type { Mood, SceneColors, StackCharacter } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

const MOODS: Mood[] = ["calm", "happy", "yay", "wow"];

/** 캐릭터 한 명. 무대와 같은 300×1000 단위를 height에 맞춘다 */
function Figure({
  character,
  mood,
  height,
  boil,
  headOnly,
}: {
  character: StackCharacter;
  mood: Mood;
  height: number;
  boil: boolean;
  headOnly?: boolean;
}) {
  const k = height / 1000;
  const pad = 12;
  const items = buildFigure({
    fx: pad,
    fy: pad,
    k,
    colors: COLORS,
    u: Math.max(1, height / 520),
    mood,
    character,
    heldColor: "#3F6E8C",
    boil,
  });
  return (
    <figure className="m-0 grid justify-items-center gap-1">
      <svg
        width={headOnly ? 360 : 300 * k + pad * 2}
        height={headOnly ? 360 : height + pad * 2 + 10}
        viewBox={
          headOnly
            ? `${pad + 40 * k} ${pad - 20 * k} ${220 * k} ${220 * k}`
            : undefined
        }
        className={headOnly ? "overflow-hidden" : "overflow-visible"}
      >
        <SceneNodes items={items} />
      </svg>
      <figcaption className="text-xs text-stone-500">
        {character}
        {MOODS.length > 1 && ` · ${mood}`}
      </figcaption>
    </figure>
  );
}

function Gallery({
  height,
  boil,
  characters,
  moods,
  headOnly,
}: {
  height: number;
  boil: boolean;
  characters: StackCharacter[];
  moods: Mood[];
  headOnly?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-6 bg-white p-6">
      {characters.flatMap((c) =>
        moods.map((m) => (
          <Figure
            key={`${c}-${m}`}
            character={c}
            mood={m}
            height={height}
            boil={boil}
            headOnly={headOnly}
          />
        )),
      )}
    </div>
  );
}

const meta: Meta<typeof Gallery> = {
  title: "ReadingLog/StackFigures",
  component: Gallery,
  args: { height: 420, boil: true },
};

export default meta;
type Story = StoryObj<typeof Gallery>;

export const Readers: Story = {
  args: { characters: ["M", "F"], moods: MOODS },
};
export const Authors: Story = {
  args: { characters: STACK_AUTHOR_IDS, moods: ["calm"] },
};
export const Lineup: Story = {
  args: { characters: ["M", "F", ...STACK_AUTHOR_IDS], moods: ["happy"] },
};
/** 얼굴을 크게 본다 */
export const Faces: Story = {
  args: {
    characters: ["M", "F"],
    moods: MOODS,
    height: 520,
    boil: false,
    headOnly: true,
  },
};
export const AuthorFaces: Story = {
  args: {
    characters: STACK_AUTHOR_IDS,
    moods: ["calm"],
    height: 520,
    boil: false,
    headOnly: true,
  },
};
