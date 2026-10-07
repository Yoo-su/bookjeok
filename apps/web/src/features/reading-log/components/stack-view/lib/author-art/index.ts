import type { AuthorArt } from "../traced";
import type { StackAuthor } from "../types";

/**
 * 작가 전신(시안에서 딴 벡터)은 한 명에 압축 20~60KB라 고른 작가 것만 그때 받는다.
 * 무대·홈 인사·공유 이미지가 같은 캐시를 쓴다
 */
const LOADERS: Record<StackAuthor, () => Promise<{ AUTHOR_ART: AuthorArt }>> = {
  kafka: () => import("./kafka"),
  sartre: () => import("./sartre"),
  camus: () => import("./camus"),
  woolf: () => import("./woolf"),
  kundera: () => import("./kundera"),
};

const cache = new Map<StackAuthor, AuthorArt>();
const pending = new Map<StackAuthor, Promise<AuthorArt>>();

export const cachedAuthorArt = (author: StackAuthor) => cache.get(author);

export function loadAuthorArt(author: StackAuthor): Promise<AuthorArt> {
  const hit = cache.get(author);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(author);
  if (!p) {
    p = LOADERS[author]()
      .then(({ AUTHOR_ART }) => {
        cache.set(author, AUTHOR_ART);
        return AUTHOR_ART;
      })
      .finally(() => pending.delete(author));
    pending.set(author, p);
  }
  return p;
}
