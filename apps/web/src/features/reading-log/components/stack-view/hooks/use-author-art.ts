"use client";

import { useEffect, useState } from "react";

import { cachedAuthorArt, loadAuthorArt } from "../lib/author-art";
import type { AuthorArt } from "../lib/traced";
import type { StackAuthor, StackCharacter } from "../lib/types";

/**
 * 작가를 세울 때 시안 전신을 받는다. 받는 동안은 `pending`이라 무대가 잠깐 그리지 않고 기다린다.
 * 받지 못하면 코드로 그린 캐리커처로 그린다
 */
export function useAuthorArt(character: StackCharacter): {
  art?: AuthorArt;
  pending: boolean;
} {
  const author = character === "M" || character === "F" ? undefined : character;
  const [state, setState] = useState<{
    author?: StackAuthor;
    art?: AuthorArt;
    failed?: boolean;
  }>(() => ({ author, art: author && cachedAuthorArt(author) }));

  useEffect(() => {
    if (!author) return;
    const hit = cachedAuthorArt(author);
    if (hit) {
      setState({ author, art: hit });
      return;
    }
    let live = true;
    loadAuthorArt(author).then(
      (art) => live && setState({ author, art }),
      () => live && setState({ author, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [author]);

  if (!author) return { pending: false };
  // 작가를 바꾼 직후 한 번은 이전 작가 상태가 남아 있으므로 캐시로 다시 본다
  const cur =
    state.author === author
      ? state
      : { art: cachedAuthorArt(author), failed: false };
  return { art: cur.art, pending: !cur.art && !cur.failed };
}
