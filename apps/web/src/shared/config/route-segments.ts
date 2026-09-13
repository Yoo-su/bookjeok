import { PATHS } from "@/shared/constants/paths";

/**
 * 로케일 바로 아래에 올 수 있는 첫 세그먼트. `PATHS`에서 파생한다.
 *
 * 목록 밖의 경로는 `[...not_found]`가 받아 133KB짜리 셸을 매 요청 렌더한다.
 * 미들웨어가 렌더 전에 끊으려면 유효 세그먼트를 알아야 한다.
 */
export const LOCALE_ROOT_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(PATHS)
    .map((value) => (typeof value === "function" ? value("x") : value))
    .map((path) => path.split("/").filter(Boolean)[0])
    .filter((segment): segment is string => Boolean(segment)),
);

/** 로케일 아래 첫 세그먼트가 실제 라우트인지. 로케일 루트(`/ko`)는 항상 통과. */
export const isKnownLocaleSegment = (segment: string | undefined) =>
  !segment || LOCALE_ROOT_SEGMENTS.has(segment);
