import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const dynamic = "force-dynamic";

/**
 * 재검증을 허용하는 경로 형태
 *
 * 토큰이 다시 유출되더라도 임의 경로를 무제한으로 때리지 못하게 막는 2차 방어선.
 * ISR이 걸린 라우트만 나열한다.
 */
const ALLOWED_PATHS = [
  /^\/(ko|en)$/,
  /^\/(ko|en)\/(lounge|insights)$/,
  /^\/(ko|en)\/book\/(market|reviews|search)$/,
  /^\/(ko|en)\/book\/sales\/\d+$/,
  /^\/(ko|en)\/book\/reviews\/\d+$/,
  /^\/(ko|en)\/book\/[0-9Xx]{10,13}\/detail$/,
  /^\/(ko|en)\/users\/[A-Za-z0-9_.-]{1,50}$/,
];

const isAllowedPath = (path: string) =>
  ALLOWED_PATHS.some((pattern) => pattern.test(path));

/** 길이·일치 위치가 응답 시간에 드러나지 않도록 상수 시간 비교 */
const matchesToken = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * On-Demand ISR 재검증 웹훅
 *
 * 시크릿은 헤더로만 받는다. 쿼리스트링은 액세스 로그·리퍼러에 남고,
 * GET을 열어두면 <img src>만으로도 외부 페이지에서 발동시킬 수 있다.
 * 그래서 POST + 헤더로 고정한다.
 */
export async function POST(request: NextRequest) {
  const token = process.env.REVALIDATE_TOKEN;

  // 폴백을 두지 않는다. 미설정 시 조용히 공개되는 것보다 기능이 멈추는 편이 낫다
  if (!token) {
    return NextResponse.json(
      { message: "REVALIDATE_TOKEN is not configured" },
      { status: 503 },
    );
  }

  const secret = request.headers.get("x-revalidate-token");
  if (!secret || !matchesToken(secret, token)) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  let path: unknown;
  let reviewId: unknown;
  let removed: unknown;
  try {
    ({ path, reviewId, removed } = await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  if (reviewId !== undefined) {
    if (
      typeof reviewId !== "number" ||
      !Number.isSafeInteger(reviewId) ||
      reviewId <= 0 ||
      typeof removed !== "boolean" ||
      path !== undefined
    ) {
      return NextResponse.json(
        { message: "Invalid review change" },
        { status: 400 },
      );
    }
    try {
      for (const locale of routing.locales) {
        revalidatePath(`/${locale}${PATHS.REVIEW_DETAIL(reviewId)}`);
        if (removed) {
          revalidatePath(`/${locale}${PATHS.REVIEWS}`);
          revalidatePath(`/${locale}`);
        }
      }
      return NextResponse.json({ revalidated: true, reviewId });
    } catch {
      return NextResponse.json(
        { message: "Revalidation failed" },
        { status: 500 },
      );
    }
  }

  if (typeof path !== "string" || !path) {
    return NextResponse.json({ message: "Path is required" }, { status: 400 });
  }

  if (!isAllowedPath(path)) {
    return NextResponse.json(
      { message: "Path is not revalidatable" },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Revalidation failed", error },
      { status: 500 },
    );
  }
}
