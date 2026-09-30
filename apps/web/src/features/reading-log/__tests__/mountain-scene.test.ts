import { MOUNTAIN_LANDMARKS, nextMountainLandmark } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

import {
  buildMountainScene,
  type MountainLabels,
  type MountainSceneOptions,
} from "@/features/reading-log/components/stack-view/lib/mountain-scene";
import type {
  SceneColors,
  SceneItem,
} from "@/features/reading-log/components/stack-view/lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};
const measure = (text: string, size: number) => text.length * size * 0.6;
const LABELS: MountainLabels = {
  total: "3.9m",
  target: "기린 약 5m",
  remain: "1.1m 남음",
  approxBooks: "약 50권",
  week: "+25cm",
  weekSub: "이번 주",
  bubble: ["1.1m만 더!", "다 같이 기린을 넘어 봐요"],
  flags: { emperor: "황제펭귄", hoop: "농구 골대" },
};
const HELD = "#AB1234";

const flat = (items: SceneItem[]): SceneItem[] =>
  items.flatMap((it) => (it.k === "g" ? [it, ...flat(it.children)] : [it]));

function scene(over: Partial<MountainSceneOptions> = {}) {
  const totalMm = 3900;
  return buildMountainScene({
    width: 800,
    minHeight: 240,
    maxHeight: 520,
    bands: Array.from({ length: 195 }, (_, i) => ({
      mm: 20,
      color: i % 2 ? "#112233" : "#445566",
    })),
    totalMm,
    weekMm: 250,
    target: nextMountainLandmark(totalMm)!,
    passed: MOUNTAIN_LANDMARKS.filter((l) => l.heightMm <= totalMm),
    heldColor: HELD,
    labels: LABELS,
    colors: COLORS,
    measure,
    ...over,
  });
}

describe("nextMountainLandmark", () => {
  it("쌓은 높이 바로 위의 이정표를 고르고, 다 넘으면 null", () => {
    expect(nextMountainLandmark(0)?.id).toBe("emperor");
    expect(nextMountainLandmark(3900)?.id).toBe("giraffe");
    expect(nextMountainLandmark(5000)?.id).toBe("cheomseongdae");
    expect(nextMountainLandmark(9_000_000)).toBeNull();
  });
});

describe("buildMountainScene", () => {
  it("띠마다 색면 하나를 그리고, 높이는 무대 범위 안이다", () => {
    const r = scene();
    const bands = flat(r.items).filter((it) => it.id?.startsWith("band-"));

    expect(bands.filter((b) => b.id !== "band-lines")).toHaveLength(195);
    expect(r.height).toBeGreaterThanOrEqual(240);
    expect(r.height).toBeLessThanOrEqual(520);
  });

  it("넘은 이정표에만 깃발을 꽂는다", () => {
    const ids = flat(scene().items)
      .map((it) => it.id)
      .filter((id) => id?.startsWith("flag-") && !id.startsWith("flag-label"));

    expect(ids).toEqual(["flag-emperor", "flag-hoop"]);
  });

  it("최근 책 색을 꼭대기 깃발과 이정표 그림에 쓴다", () => {
    const items = flat(scene().items);

    const summit = items.find((it) => it.id === "summit-flag");
    expect(
      summit &&
        summit.k === "g" &&
        flat(summit.children).some((it) => it.k === "p" && it.fill === HELD),
    ).toBe(true);
    const landmark = items.find((it) => it.id === "landmark");
    expect(
      landmark &&
        landmark.k === "g" &&
        flat(landmark.children).some((it) => it.k === "p" && it.fill === HELD),
    ).toBe(true);
  });

  it("그림이 없는 이정표는 점선과 이름만, 말풍선 없이 세운다", () => {
    const target = MOUNTAIN_LANDMARKS.find((l) => l.id === "liberty")!;
    const items = flat(scene({ target }).items);

    expect(items.some((it) => it.id === "landmark")).toBe(false);
    expect(items.some((it) => it.id === "bubble")).toBe(false);
    expect(items.find((it) => it.id === "target")).toMatchObject({
      t: "기린 약 5m",
    });
  });

  it("구름은 다시 그려도 제자리이고, 폰에서도 하나 이상 뜬다", () => {
    const clouds = (width: number) =>
      flat(scene({ width }).items).filter((it) => it.id?.startsWith("cloud-"));

    expect(clouds(800).length).toBeGreaterThan(0);
    expect(clouds(343).length).toBeGreaterThan(0);
    expect(JSON.stringify(clouds(800))).toBe(JSON.stringify(clouds(800)));
  });

  it("이번 주 기록이 없으면 괄호를 긋지 않는다", () => {
    const items = flat(scene({ weekMm: 0 }).items);

    expect(items.some((it) => it.id === "week-bracket")).toBe(false);
  });
});
