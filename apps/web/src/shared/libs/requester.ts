import { API_PATHS } from "@bookjeok/core";

/** 액세스 토큰으로 확인한 요청자 */
export interface Requester {
  id: number;
  provider: string;
  handle: string | null;
}

// 서버 통신용 API_URL을 우선 적용하고, 없을 경우 NEXT_PUBLIC_API_URL로 폴백
const apiBaseUrl = () =>
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";

/**
 * 액세스 토큰으로 요청자를 확인합니다. 서버(라우트 핸들러·서버 액션)에서만 씁니다.
 * 서버 액션과 라우트 핸들러는 누구나 호출할 수 있으므로 요청자를 직접 확인해야 합니다.
 * @throws 토큰이 유효하지 않거나 응답이 예상과 다를 때
 */
export async function resolveRequester(token: string): Promise<Requester> {
  const response = await fetch(`${apiBaseUrl()}${API_PATHS.user.profile}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Unauthorized: Invalid token");
  }

  const body = await response.json();
  const user = body?.data;

  if (!user || typeof user.id !== "number" || !user.provider) {
    throw new Error("Unauthorized: Malformed profile response");
  }

  return { id: user.id, provider: user.provider, handle: user.handle ?? null };
}

/**
 * 토큰이 유효하면 요청자를, 아니면 null을 돌려줍니다.
 * @param token 액세스 토큰 (없어도 됨)
 */
export async function findRequester(
  token?: string | null,
): Promise<Requester | null> {
  if (!token) return null;
  try {
    return await resolveRequester(token);
  } catch {
    return null;
  }
}

/**
 * 공개 프로필이 없어졌는지(탈퇴 등으로 404) 확인합니다.
 * @param handle 사용자 핸들
 */
export async function isPublicProfileGone(handle: string): Promise<boolean> {
  const response = await fetch(
    `${apiBaseUrl()}${API_PATHS.user.publicProfile(encodeURIComponent(handle))}`,
    { cache: "no-store" },
  );
  return response.status === 404;
}
