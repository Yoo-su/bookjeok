"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

import type { SceneLabels } from "../lib/scene";
import type { BodyPart, StackStatus } from "../lib/status";
import { useStackComparison } from "./use-stack-comparison";

export const cm1 = (mm: number) => (mm / 10).toFixed(1);

/** 키를 넘은 뒤의 다음 목표 배수. 1.3배면 2배, 2.4배면 3배 */
export const nextGoalTimes = (ratio: number) => Math.floor(ratio) + 1;

/** 올해 쌓은 속도로 키에 닿는 달. 지난 연도는 한 해 전체를 기간으로 본다 */
function etaDate(year: number, stackMm: number, remainMm: number) {
  const now = new Date();
  const start = new Date(year, 0, 1);
  const end = year < now.getFullYear() ? new Date(year, 11, 31) : now;
  const days = Math.max(1, (end.getTime() - start.getTime()) / 864e5);
  const pace = stackMm / days;
  if (pace <= 0) return null;
  const eta = new Date(now);
  eta.setDate(eta.getDate() + Math.ceil(remainMm / pace));
  return eta;
}

/** 독서 키재기 화면·공유 이미지에 들어가는 문구 */
export function useStackCopy() {
  const t = useTranslations("reading_log.stack");
  const locale = useLocale();
  const { author } = useStackComparison();
  const authorName = author ? t(`authors.${author}`) : null;

  const part = useCallback(
    (key: BodyPart, form: "name" | "topic" | "object") =>
      t(`parts.${key}.${form}`),
    [t],
  );

  const sceneLabels = useCallback(
    (o: {
      status: StackStatus;
      stackMm: number;
      userMm: number;
      avgDepthMm: number;
      /** 비교 작가 이름. 생략하면 저장된 선택을 따르고 null이면 내 키로 쓴다 */
      authorName?: string | null;
    }): SceneLabels => {
      const { status, stackMm, userMm, avgDepthMm } = o;
      const name = o.authorName === undefined ? authorName : o.authorName;
      const remainMm = userMm - stackMm;
      let bubble: [string, string];
      if (status.ratio >= 1)
        bubble = [t("bubble_over"), t("bubble_over_cm", { cm: status.overCm })];
      else {
        const next = t("bubble_to_next", {
          part: part(status.next ?? "head", "name"),
          cm: status.toNextCm,
        });
        bubble = [
          status.passed
            ? t("bubble_passed", { part: part(status.passed, "topic") })
            : t("bubble_start"),
          next,
        ];
      }
      if (name)
        bubble = [
          name,
          t("author_bubble_ratio", { percent: Math.floor(status.ratio * 100) }),
        ];
      return {
        myHeight: name
          ? t("approx_height", { cm: Math.round(userMm / 10) })
          : t("my_height", { cm: Math.round(userMm / 10) }),
        remain: t("remain", { cm: Math.ceil(remainMm / 10) }),
        approxBooks: t("approx_books", {
          count: Math.ceil(remainMm / Math.max(1, avgDepthMm)),
        }),
        stackHeight: `${cm1(stackMm)}cm`,
        bubble,
      };
    },
    [t, part, authorName],
  );

  const lede = useCallback(
    (o: {
      status: StackStatus;
      stackMm: number;
      userMm: number;
      year: number;
      hasBooks: boolean;
    }) => {
      const { status, stackMm, userMm, year, hasBooks } = o;
      if (!hasBooks) return t("lede_empty");
      if (authorName)
        return t("author_lede", {
          name: authorName,
          cm: Math.round(userMm / 10),
          percent: Math.floor(status.ratio * 100),
        });
      // 지난 연도는 속도로 도착 시점을 셈하지 않고 결과만 말한다
      if (year < new Date().getFullYear()) {
        if (status.ratio >= 1)
          return t("lede_past_over", { year, cm: cm1(stackMm) });
        return status.passed
          ? t("lede_past_passed", {
              year,
              cm: cm1(stackMm),
              part: part(status.passed, "object"),
            })
          : t("lede_past", { year, cm: cm1(stackMm) });
      }
      if (status.ratio >= 1) {
        const times = nextGoalTimes(status.ratio);
        return t("lede_over", {
          cm: cm1(stackMm - userMm),
          times,
          goal: Math.round((userMm * times) / 10),
        });
      }
      const eta = etaDate(year, stackMm, userMm - stackMm);
      const etaText = eta
        ? new Intl.DateTimeFormat(locale, {
            year:
              eta.getFullYear() === new Date().getFullYear()
                ? undefined
                : "numeric",
            month: "long",
          }).format(eta)
        : "-";
      const common = {
        next: part(status.next ?? "head", "name"),
        cm: status.toNextCm,
        eta: etaText,
      };
      return status.passed
        ? t("lede_passed", { ...common, part: part(status.passed, "object") })
        : t("lede_start", common);
    },
    [t, part, locale, authorName],
  );

  const shareSubline = useCallback(
    (status: StackStatus, stackMm: number, userMm: number) => {
      if (authorName)
        return t("author_share", {
          name: authorName,
          cm: Math.round(userMm / 10),
          percent: Math.floor(status.ratio * 100),
        });
      if (status.ratio >= 1)
        return t("share.sub_over", { cm: cm1(stackMm - userMm) });
      const common = {
        next: part(status.next ?? "head", "name"),
        cm: status.toNextCm,
      };
      return status.passed
        ? t("share.sub_passed", {
            ...common,
            part: part(status.passed, "object"),
          })
        : t("share.sub_start", common);
    },
    [t, part, authorName],
  );

  return { t, locale, sceneLabels, lede, shareSubline };
}
