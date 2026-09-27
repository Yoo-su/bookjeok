import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { useStackCopy } from "@/features/reading-log/components/stack-view/hooks/use-stack-copy";
import { buildObject } from "@/features/reading-log/components/stack-view/lib/figure";
import {
  objectLadder,
  objectsPassedBetween,
  STACK_OBJECTS,
  stageObject,
} from "@/features/reading-log/components/stack-view/lib/objects";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import {
  buildStackScene,
  objectSceneHeight,
  type SceneLabels,
} from "@/features/reading-log/components/stack-view/lib/scene";
import { stackStatus } from "@/features/reading-log/components/stack-view/lib/status";
import type {
  SceneColors,
  SceneItem,
} from "@/features/reading-log/components/stack-view/lib/types";
import messages from "@/shared/i18n/messages/ko.json";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};
const measure = (text: string, size: number) => text.length * size * 0.6;
const LABELS: SceneLabels = {
  myHeight: "연필 한 자루 약 17.5cm",
  myHeightShort: "약 17.5cm",
  remain: "9cm 남음",
  approxBooks: "약 6권",
  stackHeight: "8.7cm",
  bubble: ["9cm만 더!", "지우개는 넘었다!"],
};

const flat = (items: SceneItem[]): SceneItem[] =>
  items.flatMap((it) => (it.k === "g" ? [it, ...flat(it.children)] : [it]));
const stackOf = (n: number) => SAMPLE_BOOKS.slice(0, n);
const mmOf = (n: number) => stackOf(n).reduce((a, b) => a + b.depth, 0);

function scene(n: number, width: number, height = 600) {
  const books = stackOf(n);
  const stackMm = mmOf(n);
  return buildStackScene({
    width,
    height,
    books,
    stackMm,
    userMm: 1730,
    character: "M",
    status: stackStatus(stackMm, 1730),
    labels: LABELS,
    colors: COLORS,
    measure,
    object: stageObject(stackMm),
  });
}

describe("사물 사다리", () => {
  it("낮은 것부터 겹치지 않게 올라간다", () => {
    const heights = STACK_OBJECTS.map((o) => o.heightMm);
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(heights.length);
  });

  it("높이가 같으면 넘은 것으로 친다", () => {
    expect(objectLadder(0)).toEqual({ passed: null, next: STACK_OBJECTS[0] });
    const eraser = STACK_OBJECTS.find((o) => o.id === "eraser")!;
    expect(objectLadder(eraser.heightMm).passed?.id).toBe("eraser");
    expect(objectLadder(eraser.heightMm).next?.id).toBe("egg");
  });

  it("다 넘으면 다음은 없고 무대에는 가장 큰 사물을 세운다", () => {
    const top = STACK_OBJECTS[STACK_OBJECTS.length - 1];
    expect(objectLadder(top.heightMm + 1)).toEqual({ passed: top, next: null });
    expect(stageObject(top.heightMm + 1)).toBe(top);
  });

  it("두꺼운 책 한 권으로 여러 개를 넘으면 낮은 것부터 모두 준다", () => {
    expect(objectsPassedBetween(40, 120).map((o) => o.id)).toEqual([
      "eraser",
      "egg",
      "hamster",
    ]);
    expect(objectsPassedBetween(290, 299)).toEqual([]);
  });
});

describe("사물 그림", () => {
  it.each(STACK_OBJECTS.map((o) => o.id))(
    "%s는 최근 읽은 책 색을 쓰고, 떨림용 세 벌을 서로 다르게 그린다",
    (id) => {
      const items = buildObject({
        fx: 0,
        fy: 0,
        k: 0.4,
        colors: COLORS,
        u: 1,
        object: id,
        heldColor: "#3F6E8C",
        boil: true,
      });
      const groups = items.filter((it) => it.k === "g");
      expect(groups).toHaveLength(3);
      const paths = flat(items).filter((it) => it.k === "p");
      expect(paths.some((it) => it.k === "p" && it.fill === "#3F6E8C")).toBe(
        true,
      );
      const d = (g: SceneItem) =>
        flat([g])
          .map((it) => (it.k === "p" ? it.d : ""))
          .join();
      expect(d(groups[0])).not.toBe(d(groups[1]));
    },
  );
});

describe("사물 무대", () => {
  it("캐릭터 대신 사물을 세운다", () => {
    const ids = flat(scene(6, 620).items).map((it) => it.id);
    expect(ids).toContain("object");
    expect(ids).not.toContain("character");
  });

  it("좁은 화면에서 이름표가 말풍선과 부딪히면 짧은 이름표를 쓴다", () => {
    const label = (w: number) =>
      flat(scene(6, w).items).find((it) => it.id === "my-height");
    expect(label(310)).toMatchObject({ t: "약 17.5cm" });
    expect(label(620)).toMatchObject({ t: "연필 한 자루 약 17.5cm" });
  });

  it("사물이 너무 작게 보이면 쌓은 책을 잘라 가까이 찍고 눈금자를 위에 얹는다", () => {
    // 한 권(각설탕 1.6cm)을 모바일 폭에서
    const s = scene(1, 330, 200);
    const ids = s.items.map((it) => it.id);
    expect(ids).toContain("ruler-band");
    // 눈금자가 책보다 뒤에 그려진다(위에 보인다)
    expect(ids.indexOf("ruler")).toBeGreaterThan(
      ids.findIndex((id) => id?.startsWith("book-")),
    );
    // 잘려도 클릭 영역은 무대 안에서 시작한다
    expect(s.stack.left).toBe(0);
  });

  it("쌓은 책이 없으면 자리를 비워 두지 않고 사물을 가운데쯤 세운다", () => {
    const width = 650;
    const s = scene(0, width, 260);
    const items = flat(s.items);
    expect(items.map((it) => it.id)).not.toContain("stack-shadow");
    // 사물 그림의 가로 범위가 무대 가운데를 지난다
    const xs = flat(items.filter((it) => it.id === "object"))
      .filter((it) => it.k === "p")
      .flatMap((it) =>
        it.k === "p"
          ? [...it.d.matchAll(/[ML](-?[\d.]+),/g)].map((m) => Number(m[1]))
          : [],
      );
    expect(Math.min(...xs)).toBeLessThan(width / 2 + 40);
    expect(Math.max(...xs)).toBeGreaterThan(width / 2 - 40);
    // 남은 높이 글자는 눈금자(46px) 오른쪽에 있다
    const remain = items.find((it) => it.k === "t" && it.t === LABELS.remain);
    expect(remain && remain.k === "t" && remain.x).toBeGreaterThan(46);
  });

  it("쌓은 책이 다 들어가면 자르지 않는다", () => {
    const ids = scene(46, 620).items.map((it) => it.id);
    expect(ids).not.toContain("ruler-band");
  });

  it("무대 높이는 폭에 맞춘 내용만큼이고 범위를 넘지 않는다", () => {
    const h = (n: number, width: number) =>
      objectSceneHeight({
        width,
        books: stackOf(n),
        stackMm: mmOf(n),
        object: stageObject(mmOf(n)),
        minHeight: 200,
        maxHeight: 600,
      });
    for (const n of [1, 6, 14, 46])
      for (const w of [262, 330, 620]) {
        expect(h(n, w)).toBeGreaterThanOrEqual(200);
        expect(h(n, w)).toBeLessThanOrEqual(600);
      }
    // 좁을수록 축척이 작아 무대도 낮다
    expect(h(14, 262)).toBeLessThan(h(14, 620));
  });
});

describe("사물 문구", () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <NextIntlClientProvider locale="ko" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
  const copy = () =>
    renderHook(() => useStackCopy(), { wrapper }).result.current;

  it("말풍선은 남은 높이와 넘은 사물을, 이름표는 사물 이름과 높이를 적는다", () => {
    const { objectScene } = copy();
    // 8.7cm: 달걀(7.5cm)을 넘었고 다음은 햄스터(11cm)
    const { object, labels } = objectScene(87, 15);
    expect(object.id).toBe("hamster");
    expect(labels.bubble).toEqual(["2.3cm만 더!", "달걀은 넘었다!"]);
    expect(labels.myHeight).toBe("햄스터 약 11cm");
    expect(labels.myHeightShort).toBe("약 11cm");
  });

  it("1m가 넘는 사물은 m로 적는다", () => {
    const { objectScene, len } = copy();
    expect(objectScene(1000, 15).labels.myHeight).toBe("황제펭귄 약 1.15m");
    expect(len(5000)).toBe("5m");
    expect(len(16)).toBe("1.6cm");
  });

  it("다 넘으면 가장 큰 사물보다 얼마나 높은지 말한다", () => {
    const { objectScene, objectLede } = copy();
    expect(objectScene(6148, 20).labels.bubble).toEqual([
      "기린보다 높다!",
      "+115cm",
    ]);
    expect(
      objectLede({
        stackMm: 6148,
        year: new Date().getFullYear(),
        hasBooks: true,
      }),
    ).toBe("쌓은 책이 기린보다 1.15m 높아요.");
  });
});
