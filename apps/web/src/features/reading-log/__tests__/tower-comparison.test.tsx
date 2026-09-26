import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import React, { type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { useTowerComparison } from "@/features/reading-log/components/tower-view/hooks/use-tower-comparison";
import { useTowerCopy } from "@/features/reading-log/components/tower-view/hooks/use-tower-copy";
import {
  TOWER_AUTHOR_IDS,
  TOWER_AUTHORS,
} from "@/features/reading-log/components/tower-view/lib/authors";
import { buildFigure } from "@/features/reading-log/components/tower-view/lib/figure";
import { towerStatus } from "@/features/reading-log/components/tower-view/lib/status";
import type {
  Mood,
  SceneItem,
  TowerCharacter,
} from "@/features/reading-log/components/tower-view/lib/types";
import { useTowerSettingsStore } from "@/features/reading-log/stores/use-tower-settings-store";
import messages from "@/shared/i18n/messages/ko.json";

const wrapper = ({ children }: PropsWithChildren) => (
  <NextIntlClientProvider locale="ko" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

beforeEach(() => {
  useTowerSettingsStore.setState({
    heightCm: 168,
    character: "F",
    author: null,
  });
});

describe("책탑 비교 대상", () => {
  it("작가를 번갈아 골라도 입력한 내 키와 캐릭터는 유지한다", () => {
    const { result } = renderHook(useTowerComparison);
    expect(result.current.heightCm).toBe(168);
    for (const author of [
      "camus",
      "sartre",
      "kundera",
      "woolf",
      "kafka",
    ] as const) {
      act(() => result.current.setAuthor(author));
      expect(result.current.character).toBe(author);
      expect(result.current.heightCm).toBe(TOWER_AUTHORS[author].heightCm);
      expect(useTowerSettingsStore.getState().heightCm).toBe(168);
    }
    act(() => result.current.setAuthor(null));
    expect(result.current.character).toBe("F");
    expect(result.current.heightCm).toBe(168);
  });

  it("화면과 공유 문구에 선택한 작가와 추정 키를 표시한다", () => {
    useTowerSettingsStore.setState({ author: "kafka" });
    const { result } = renderHook(useTowerCopy, { wrapper });
    const status = towerStatus(910, 1820);
    const labels = result.current.sceneLabels({
      status,
      towerMm: 910,
      userMm: 1820,
      avgDepthMm: 20,
    });
    expect(labels.myHeight).toContain("약 182cm");
    expect(labels.bubble[0]).toBe("프란츠 카프카");
    const shared = result.current.shareSubline(status, 910, 1820);
    expect(shared).toContain("프란츠 카프카");
    expect(shared).toContain("50%");
    expect(shared).toContain("약 182cm");
  });
});

const COLORS = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#2563EB",
  muted: "#78716C",
  faint: "#A8A29E",
};

const figure = (
  character: TowerCharacter,
  o: { mood?: Mood; boil?: boolean; heldColor?: string } = {},
) =>
  buildFigure({
    fx: 0,
    fy: 0,
    k: 1,
    colors: COLORS,
    u: 1,
    mood: o.mood ?? "calm",
    character,
    heldColor: o.heldColor ?? "#3F6E8C",
    boil: o.boil ?? false,
  });

describe.each(["M", "F"] as const)(
  "기본 %s 캐릭터의 높이별 반응",
  (character) => {
    it("높이에 따라 표정과 대사가 함께 바뀐다", () => {
      useTowerSettingsStore.setState({ author: null, character });
      const { result } = renderHook(useTowerCopy, { wrapper });
      const pictures: string[] = [];
      const speeches: string[] = [];
      for (const [ratio, mood] of [
        [0.1, "calm"],
        [0.65, "happy"],
        [0.95, "yay"],
        [1.1, "wow"],
      ] as const) {
        const status = towerStatus(ratio * 1700, 1700);
        expect(status.mood).toBe(mood);
        pictures.push(JSON.stringify(figure(character, { mood })));
        speeches.push(
          result.current
            .sceneLabels({
              status,
              towerMm: ratio * 1700,
              userMm: 1700,
              avgDepthMm: 20,
            })
            .bubble.join(" "),
        );
      }
      expect(new Set(pictures).size).toBe(4);
      expect(new Set(speeches).size).toBe(4);
    });
  },
);

describe("작가 캐리커처", () => {
  it("다섯 명 모두 서로 다른 손그림 선으로 그린다", () => {
    const drawings = TOWER_AUTHOR_IDS.map((id) => figure(id));
    for (const items of drawings) {
      const [, body] = items;
      expect(body).toMatchObject({ k: "g", id: "figure-0" });
      if (body.k !== "g") throw new Error("figure group");
      expect(body.children.every((it) => it.k === "p")).toBe(true);
    }
    expect(new Set(drawings.map((d) => JSON.stringify(d))).size).toBe(5);
  });

  it("화면에서는 선을 세 벌 그려 떨리게 하고, 공유 이미지는 한 벌만 그린다", () => {
    const classes = (items: SceneItem[]) =>
      items.flatMap((it) => (it.k === "g" ? [it.cls] : []));
    expect(classes(figure("kafka", { boil: true }))).toEqual([
      "tower-boil tower-boil-0",
      "tower-boil tower-boil-1",
      "tower-boil tower-boil-2",
    ]);
    expect(classes(figure("kafka"))).toEqual(["tower-figure"]);
  });

  it("기본 캐릭터처럼 가장 최근에 읽은 책 색을 손에 든다", () => {
    for (const id of TOWER_AUTHOR_IDS) {
      const json = JSON.stringify(figure(id, { heldColor: "#AB1234" }));
      expect(json).toContain('"fill":"#AB1234"');
    }
  });
});
