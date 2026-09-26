"use client";

import { useStackSettingsStore } from "../../../stores/use-stack-settings-store";
import { STACK_AUTHORS } from "../lib/authors";
import { useStackPerson } from "./use-stack-person";

/** 비교 대상을 바꿔도 입력한 내 키와 기본 캐릭터는 보존한다. */
export function useStackComparison() {
  const person = useStackPerson();
  const savedAuthor = useStackSettingsStore((s) => s.author);
  const setAuthor = useStackSettingsStore((s) => s.setAuthor);
  const author =
    savedAuthor && Object.hasOwn(STACK_AUTHORS, savedAuthor)
      ? savedAuthor
      : null;
  return {
    ...person,
    author,
    setAuthor,
    character: author ?? person.character,
    heightCm: author ? STACK_AUTHORS[author].heightCm : person.heightCm,
    isDefaultHeight: !author && person.isDefaultHeight,
  };
}
