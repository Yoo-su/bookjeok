"use client";

import { useTowerSettingsStore } from "../../../stores/use-tower-settings-store";
import { TOWER_AUTHORS } from "../lib/authors";
import { useTowerPerson } from "./use-tower-person";

/** 비교 대상을 바꿔도 입력한 내 키와 기본 캐릭터는 보존한다. */
export function useTowerComparison() {
  const person = useTowerPerson();
  const savedAuthor = useTowerSettingsStore((s) => s.author);
  const setAuthor = useTowerSettingsStore((s) => s.setAuthor);
  const author =
    savedAuthor && Object.hasOwn(TOWER_AUTHORS, savedAuthor)
      ? savedAuthor
      : null;
  return {
    ...person,
    author,
    setAuthor,
    character: author ?? person.character,
    heightCm: author ? TOWER_AUTHORS[author].heightCm : person.heightCm,
    isDefaultHeight: !author && person.isDefaultHeight,
  };
}
