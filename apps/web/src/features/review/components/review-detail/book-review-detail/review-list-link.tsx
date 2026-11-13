"use client";

import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import {
  previousAppUrl,
  splitLocalizedPath,
} from "@/shared/utils/browser-navigation";

export function ReviewListLink(
  props: Pick<ComponentProps<typeof Link>, "children" | "className">,
) {
  const from = new URLSearchParams(useSearchParams().get("from") ?? "");
  for (const key of Array.from(from.keys())) {
    if (!["category", "tag", "isbn", "search"].includes(key)) from.delete(key);
  }
  const query = from.toString();
  const href = query ? PATHS.REVIEWS + "?" + query : PATHS.REVIEWS;

  return (
    <Link
      {...props}
      href={href}
      replace
      onNavigate={(event) => {
        const { pathname, search } = window.location;
        const current = splitLocalizedPath(pathname);
        for (let steps = 1; ; steps++) {
          const previous = previousAppUrl(steps);
          if (!previous) return;
          // 리뷰 목차에서 이동한 이력은 건너뛰고 목록의 위치로 돌아간다.
          if (previous.pathname === pathname && previous.search === search)
            continue;
          const target = splitLocalizedPath(previous.pathname);
          if (
            target.locale === current.locale &&
            target.pathname === PATHS.REVIEWS
          ) {
            event.preventDefault();
            window.history.go(-steps);
          }
          return;
        }
      }}
    />
  );
}
