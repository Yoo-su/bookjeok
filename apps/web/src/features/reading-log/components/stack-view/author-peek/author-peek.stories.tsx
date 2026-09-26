import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";

import { STACK_AUTHOR_IDS } from "../lib/authors";
import type { StackAuthor } from "../lib/types";
import { AuthorPeek, type PeekAction, type PeekSide } from "./index";

const pick = <T,>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/** 홈 「주목할 만한 도서」 머리글 자리를 흉내 낸 시안 */
function HomeHeaderDemo({
  height,
  autoplay = false,
}: {
  height: number;
  autoplay?: boolean;
}) {
  const [author, setAuthor] = useState<StackAuthor>("kafka");
  const [side, setSide] = useState<PeekSide>("left");
  const [action, setAction] = useState<PeekAction>("wave");
  const [playKey, setPlayKey] = useState(0);
  const [auto, setAuto] = useState(autoplay);
  const play = (a: PeekAction) => {
    setAction(a);
    setPlayKey((v) => v + 1);
  };

  // 자동: 끝나고 1.5초 쉰 뒤 아무 작가·방향·동작으로 다시
  const [idle, setIdle] = useState(true);
  useEffect(() => {
    if (!auto || !idle) return;
    const id = setTimeout(() => {
      setAuthor(pick(STACK_AUTHOR_IDS));
      setSide(pick(["left", "right"] as const));
      setIdle(false);
      play(pick(["bow", "wave", "heart"] as const));
    }, 1500);
    return () => clearTimeout(id);
  }, [auto, idle]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 px-4 text-sm">
        <button
          type="button"
          className="rounded-full border px-3 py-1"
          onClick={() => play("bow")}
        >
          고개 숙여 인사
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1"
          onClick={() => play("wave")}
        >
          손 흔들기
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1"
          onClick={() => play("heart")}
        >
          손하트
        </button>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value as StackAuthor)}
          className="rounded border px-2 py-1"
        >
          {STACK_AUTHOR_IDS.map((id) => (
            <option key={id}>{id}</option>
          ))}
        </select>
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as PeekSide)}
          className="rounded border px-2 py-1"
        >
          <option value="left">왼쪽</option>
          <option value="right">오른쪽</option>
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          자동(랜덤)
        </label>
      </div>
      <section className="relative grid h-[420px] place-content-center overflow-hidden bg-white text-center">
        <h2 className="font-serif text-[64px] font-medium tracking-tight text-stone-900">
          주목할 만한 도서
        </h2>
        <p className="mt-4 text-[22px] text-stone-500">
          주요 출판사의 베스트셀러를 확인해보세요.
        </p>
        <AuthorPeek
          key={`${author}-${side}-${action}`}
          author={author}
          side={side}
          action={action}
          height={height}
          playKey={playKey}
          onDone={() => setIdle(true)}
        />
      </section>
    </div>
  );
}

const meta: Meta<typeof HomeHeaderDemo> = {
  title: "Home/AuthorPeek",
  component: HomeHeaderDemo,
  parameters: { layout: "fullscreen" },
  args: { height: 270 },
};

export default meta;
export const Demo: StoryObj<typeof HomeHeaderDemo> = {};
/** 열자마자 아무 작가·방향·동작으로 계속 나온다 */
export const Autoplay: StoryObj<typeof HomeHeaderDemo> = {
  args: { autoplay: true },
};
