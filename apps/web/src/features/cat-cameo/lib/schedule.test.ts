import { describe, expect, it } from "vitest";

import { CAMEO_RULES, canCameoOn } from "../constants";
import { type CameoLedger, dayKey, rollCameo } from "./schedule";

const NOW = new Date(2026, 10, 5, 14, 0).getTime();
const fresh: CameoLedger = { day: "", shownToday: 0, lastScene: null };
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe("rollCameo", () => {
  const base = {
    now: NOW,
    ledger: fresh,
    session: { shown: 0, lastAt: 0 },
    available: ["walk", "peek"] as ("walk" | "peek")[],
  };

  it("주사위가 확률 안이면 장면을 고른다", () => {
    expect(rollCameo({ ...base, rand: seq(0.1, 0) })).toBe("walk");
    expect(rollCameo({ ...base, rand: seq(0.1, 0.9) })).toBe("peek");
  });

  it("주사위가 빗나가면 나오지 않는다", () => {
    expect(rollCameo({ ...base, rand: seq(CAMEO_RULES.chance) })).toBeNull();
  });

  it("같은 페이지에서 다시 굴릴 땐 다시 굴리는 확률을 쓴다", () => {
    const between = (CAMEO_RULES.retryChance + CAMEO_RULES.chance) / 2;
    expect(rollCameo({ ...base, rand: seq(between, 0) })).toBe("walk");
    expect(
      rollCameo({ ...base, retry: true, rand: seq(between, 0) }),
    ).toBeNull();
    expect(
      rollCameo({
        ...base,
        retry: true,
        rand: seq(CAMEO_RULES.retryChance - 0.01, 0),
      }),
    ).toBe("walk");
  });

  it("바로 전 장면은 다른 장면이 있으면 피한다", () => {
    const ledger = { ...fresh, lastScene: "walk" as const };
    expect(rollCameo({ ...base, ledger, rand: seq(0, 0) })).toBe("peek");
    expect(
      rollCameo({ ...base, ledger, available: ["walk"], rand: seq(0, 0) }),
    ).toBe("walk");
  });

  it("하루 한도를 채우면 나오지 않고, 날이 바뀌면 다시 나온다", () => {
    const full = {
      ...fresh,
      day: dayKey(NOW),
      shownToday: CAMEO_RULES.perDay,
    };
    expect(rollCameo({ ...base, ledger: full, rand: seq(0) })).toBeNull();
    const tomorrow = NOW + 24 * 3600_000;
    expect(
      rollCameo({ ...base, now: tomorrow, ledger: full, rand: seq(0) }),
    ).not.toBeNull();
  });

  it("세션 한도와 최소 간격을 지킨다", () => {
    const rand = seq(0);
    expect(
      rollCameo({
        ...base,
        session: { shown: CAMEO_RULES.perSession, lastAt: 0 },
        rand,
      }),
    ).toBeNull();
    const recent = { shown: 1, lastAt: NOW - CAMEO_RULES.minGap + 1000 };
    expect(rollCameo({ ...base, session: recent, rand })).toBeNull();
    const later = { shown: 1, lastAt: NOW - CAMEO_RULES.minGap - 1000 };
    expect(rollCameo({ ...base, session: later, rand })).not.toBeNull();
  });

  it("나올 자리가 없으면 나오지 않는다", () => {
    expect(rollCameo({ ...base, available: [], rand: seq(0) })).toBeNull();
  });
});

describe("canCameoOn", () => {
  it.each([
    ["/", true],
    ["/lounge", true],
    ["/book/reviews/12", true],
    ["/my-page/reading-log", true],
    ["/login", false],
    ["/signup", false],
    ["/book/reviews/write", false],
    ["/book/reviews/12/edit", false],
    ["/book/sales/register", false],
    ["/my-page/sales/3/edit", false],
    ["/order/payment/9", false],
    ["/admin/feedback", false],
  ])("%s → %s", (path, ok) => {
    expect(canCameoOn(path)).toBe(ok);
  });
});

describe("dayKey", () => {
  it("로컬 날짜로 끊는다", () => {
    expect(dayKey(new Date(2026, 0, 3, 23, 59).getTime())).toBe("2026-01-03");
    expect(dayKey(new Date(2026, 0, 4, 0, 1).getTime())).toBe("2026-01-04");
  });
});
