import { PATHS } from "@/shared/constants/paths";

const DYNAMIC_SEGMENT = "__route_param__";
const ROUTE_SEGMENTS = Object.values(PATHS).map((value) =>
  (typeof value === "function" ? value(DYNAMIC_SEGMENT) : value)
    .split("/")
    .filter(Boolean),
);

/** 첫 세그먼트뿐 아니라 전체 형태를 검사해 catch-all의 반복 SSR을 막는다. */
export const isKnownLocalePath = (segments: string[]) =>
  ROUTE_SEGMENTS.some(
    (route) =>
      route.length === segments.length &&
      route.every(
        (segment, index) =>
          segment === DYNAMIC_SEGMENT || segment === segments[index],
      ),
  );
