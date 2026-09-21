import { REVIEW_TAG_MAX_LENGTH } from "./constants";

/**
 * 태그 표기를 저장 전에 하나로 맞춥니다. 서버가 강제하고, 작성 폼은 중복 판정에
 * 같은 규칙을 씁니다.
 *
 * **소문자로 내리지 않습니다.** 운영 태그 117개 중 라틴 문자가 섞인 것은 2개뿐이고
 * (`SF`/`sf`), 소문자화하면 표시까지 `sf`가 되어 더 나빠집니다. 대소문자 흔들림은
 * 입력 자동완성이 기존 `SF`를 제안해 막습니다.
 *
 * **내부 공백도 지우지 않습니다.** 압축만 합니다. `의식의 흐름`, `가즈오 이시구로`
 * 같은 태그가 붙어버립니다.
 */
export const normalizeTagName = (raw: string): string =>
  raw
    .normalize("NFC")
    // 사람이 습관적으로 붙이는 선행 #. 표시할 때 UI가 다시 붙인다.
    .replace(/^[#\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, REVIEW_TAG_MAX_LENGTH);

/**
 * 태그 목록을 정규화하고 빈 값과 중복을 걷어냅니다. 순서는 처음 입력한 순서를
 * 유지합니다.
 */
export const normalizeTagNames = (raw: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of raw) {
    const normalized = normalizeTagName(name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};
