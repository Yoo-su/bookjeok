import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import enMessages from "../messages/en.json";
import koMessages from "../messages/ko.json";

const en = createTranslator({ locale: "en", messages: enMessages });
const ko = createTranslator({ locale: "ko", messages: koMessages });

describe("영문 메시지 복수형", () => {
  it.each([
    ["order.trade_review.stats.badge_trades_only", 1, "1 completed trade"],
    ["order.trade_review.stats.badge_trades_only", 2, "2 completed trades"],
    ["lounge.feed.readers_summary", 1, "1 reading log"],
    ["lounge.feed.readers_summary", 3, "3 reading logs"],
    ["insights.charts.category.tooltip", 1, "1 review"],
    ["insights.charts.category.tooltip", 7, "7 reviews"],
    ["my_comments.likes_count", 1, "1 Like"],
    ["my_comments.likes_count", 12, "12 Likes"],
  ])("%s (count=%i) → %s", (key, count, expected) => {
    expect(en(key as never, { count } as never)).toBe(expected);
  });

  it("다른 인자와 함께 써도 복수형이 적용된다", () => {
    expect(
      en(
        "order.trade_review.stats.badge_trust_direct" as never,
        {
          count: 1,
          rate: 100,
        } as never,
      ),
    ).toBe("1 in-person trade · 100% positive");
  });

  it("한국어는 수량에 따라 표기가 바뀌지 않는다", () => {
    expect(
      ko(
        "order.trade_review.stats.badge_trades_only" as never,
        {
          count: 1,
        } as never,
      ),
    ).toBe("거래 완료 1건");
  });
});

describe("메시지 카탈로그 구조", () => {
  const collectKeys = (node: unknown, prefix = ""): string[] => {
    if (typeof node === "string") return [prefix];

    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      collectKeys(v, prefix ? `${prefix}.${k}` : k),
    );
  };

  it("두 로케일의 키 집합이 같다", () => {
    const enKeys = collectKeys(enMessages).sort();
    const koKeys = collectKeys(koMessages).sort();

    expect(enKeys.filter((k) => !koKeys.includes(k))).toEqual([]);
    expect(koKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it("영문 카탈로그에 한글이 남아 있지 않다", () => {
    const collectEntries = (node: unknown, prefix = ""): [string, string][] => {
      if (typeof node === "string") return [[prefix, node]];

      return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
        collectEntries(v, prefix ? `${prefix}.${k}` : k),
      );
    };

    const untranslated = collectEntries(enMessages)
      .filter(([, value]) => /[가-힣]/.test(value))
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });
});
