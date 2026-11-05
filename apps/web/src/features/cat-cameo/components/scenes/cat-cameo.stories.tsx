import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SceneNodes } from "@/features/reading-log/components/stack-view/lib/scene-svg";
import { DefaultHeader } from "@/layouts/default-layout/default-header";

import type { CameoScene } from "../../constants";
import {
  type CatPart as CatPartData,
  drawPeekingCat,
  drawWalkingCat,
} from "../../lib/draw";
import { BottomPeek } from "./bottom-peek";
import { HeaderWalk } from "./header-walk";

/** 상단바 알약과 같은 크기·여백. 실제 헤더는 다른 기능(검색·알림)을 끌어와 여기선 모양만 흉내 낸다 */
function FakeHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-50 w-full px-3 py-2.5 sm:px-4 sm:py-3"
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-stone-200/70 bg-white/80 px-4 py-2.5 shadow-[0_4px_20px_-10px_rgba(28,25,23,0.16)] backdrop-blur-xl sm:px-6">
        <span className="font-[family-name:var(--font-gowun-batang)] text-lg font-bold">
          북적
        </span>
        <nav className="hidden gap-7 font-[family-name:var(--font-gowun-batang)] text-sm text-stone-600 lg:flex">
          <span>라운지</span>
          <span>독서기록</span>
          <span>책리뷰</span>
          <span>중고마켓</span>
          <span>검색</span>
        </nav>
        <span className="h-10 w-10 rounded-full bg-stone-200" />
      </div>
    </header>
  );
}

/** 장면이 끝나면 잠시 쉬었다 다시 튼다. 고양이를 누르면 놀라 달아난다 */
function Loop({ scene, real }: { scene: CameoScene; real?: boolean }) {
  const [run, setRun] = useState(0);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(
      scene === "walk"
        ? document.querySelector<HTMLElement>("[data-site-header] > div")
        : document.body,
    );
  }, [scene]);
  const onDone = useCallback(() => {
    window.setTimeout(() => setRun((r) => r + 1), 900);
  }, []);
  const Scene = scene === "walk" ? HeaderWalk : BottomPeek;
  return (
    <div className="min-h-dvh bg-[radial-gradient(#e7e5e4_1px,transparent_1.2px)] bg-[length:18px_18px]">
      {real ? <DefaultHeader /> : <FakeHeader />}
      <main className="mx-auto max-w-5xl space-y-3 p-4 text-sm text-stone-500">
        {Array.from({ length: 6 }, (_, i) => (
          <p
            key={i}
            className="h-16 rounded-xl border border-stone-200 bg-white"
          />
        ))}
      </main>
      {host && (
        <Scene key={run} host={host} rand={Math.random} onDone={onDone} />
      )}
    </div>
  );
}

/** 움직임 없이 크게 본 자세들. 그림 손볼 때 쓴다 */
function Poses({ scale = 2 }: { scale?: number }) {
  const walk = useMemo(() => drawWalkingCat(scale), [scale]);
  const peek = useMemo(() => drawPeekingCat(35 * scale), [scale]);
  // stride: 대각선 두 쌍을 앞뒤로 벌린 정도(-1~1). 걸음 중간 모습을 멈춰 본다
  const leg = (part: CatPartData, deg: number) => (
    <g
      style={{
        transform: `rotate(${deg}deg)`,
        transformOrigin: `${part.pivot[0]}px ${part.pivot[1]}px`,
      }}
    >
      <SceneNodes items={part.items} />
    </g>
  );
  const pose = (front: boolean, stride = 0) => (
    <svg
      aria-label={front ? "정면으로 고개 돌리기" : "걷는 옆모습"}
      role="img"
      width={walk.width}
      height={walk.height}
      className="max-w-full bg-white"
    >
      <SceneNodes items={walk.tail.items} />
      {leg(walk.farLegs[0], stride * walk.hindSwing)}
      {leg(walk.farLegs[1], -stride * walk.swing)}
      <SceneNodes items={walk.body} />
      {leg(walk.nearLegs[0], -stride * walk.hindSwing)}
      {leg(walk.nearLegs[1], stride * walk.swing)}
      {front ? (
        <>
          <SceneNodes items={walk.front.face} />
          <SceneNodes items={walk.front.eyes} />
          <SceneNodes items={walk.front.pupils} />
        </>
      ) : (
        <SceneNodes items={walk.profile} />
      )}
    </svg>
  );
  return (
    <div className="flex flex-wrap items-end gap-6 bg-stone-50 p-6">
      {pose(false)}
      {pose(false, 1)}
      {pose(false, -1)}
      {pose(true)}
      <svg
        aria-label="모서리에서 빼꼼"
        role="img"
        width={peek.width}
        height={peek.height}
        className="max-w-full bg-white"
      >
        <SceneNodes items={peek.front.face} />
        <SceneNodes items={peek.front.eyes} />
        <SceneNodes items={peek.front.pupils} />
        <SceneNodes items={peek.paws} />
      </svg>
    </div>
  );
}

const meta = {
  title: "Features/CatCameo/Scenes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 상단바 알약 안을 걸어 지나가다 멈춰 이쪽을 보고 천천히 눈을 감았다 뜬다 */
export const HeaderWalkLoop: Story = { render: () => <Loop scene="walk" /> };
/** 실제 상단바(로고·메뉴·로그인 버튼) 위로 지나가는 모습. 메뉴와 겹치는 정도를 본다 */
export const HeaderWalkOnRealHeader: Story = {
  render: () => <Loop scene="walk" real />,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/ko/lounge" } },
  },
};
/** 화면 아래 모서리에서 귀부터 올라와 두리번거리다 쏙 내려간다 */
export const BottomPeekLoop: Story = { render: () => <Loop scene="peek" /> };
/** 걷는 옆모습 · 멈춰 정면 · 빼꼼 */
export const StillPoses: Story = { render: () => <Poses /> };

/** 헤더에서 보이는 크기로 눈과 실루엣을 확인한다 */
export const ActualSize: Story = { render: () => <Poses scale={0.42} /> };
