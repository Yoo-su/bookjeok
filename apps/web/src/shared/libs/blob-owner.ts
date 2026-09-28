import { type Requester, resolveRequester } from "./requester";

/** Blob 경로의 소유자. 경로는 항상 `{provider}-{id}/...`로 시작한다 */
export type BlobOwner = Pick<Requester, "id" | "provider">;

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * 액세스 토큰으로 Blob 소유자를 확인합니다.
 * @throws 토큰이 유효하지 않을 때
 */
export async function resolveBlobOwner(token: string): Promise<BlobOwner> {
  const { id, provider } = await resolveRequester(token);
  return { id, provider };
}

/** 소유자 디렉터리 이름 (`{provider}-{id}`) */
export function blobOwnerPrefix(owner: BlobOwner): string {
  return `${owner.provider}-${owner.id}`;
}

/**
 * Blob URL이 소유자 디렉터리 안의 파일인지 확인합니다.
 * 우리 스토어 호스트가 아니거나 상위 경로 탈출이 섞인 URL은 거부합니다.
 */
export function isOwnedBlobUrl(url: string, owner: BlobOwner): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)
  ) {
    return false;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return false;
  }

  if (pathname.includes("..")) return false;
  return pathname.startsWith(`/${blobOwnerPrefix(owner)}/`);
}
