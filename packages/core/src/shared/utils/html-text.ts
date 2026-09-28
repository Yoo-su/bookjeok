/** 이름 있는 HTML 엔티티 표. `&amp;`는 여기 두지 않는다 (마지막에 따로 처리). */
const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  bull: "•",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  laquo: "«",
  raquo: "»",
  deg: "°",
  times: "×",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** 코드포인트를 문자로 바꾼다. 범위를 벗어나면 원문을 그대로 남긴다. */
function fromCodePoint(code: number, raw: string): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return raw;
  try {
    return String.fromCodePoint(code);
  } catch {
    return raw;
  }
}

/**
 * HTML 엔티티를 한 번 디코딩한다.
 * `&amp;`를 마지막에 처리해야 `&amp;lt;`가 `<`로 과하게 풀리지 않는다.
 */
function decodeEntitiesOnce(text: string): string {
  return text
    .replace(/&#(\d+);/g, (raw, dec: string) => fromCodePoint(Number(dec), raw))
    .replace(/&#x([0-9a-fA-F]+);/g, (raw, hex: string) =>
      fromCodePoint(parseInt(hex, 16), raw),
    )
    .replace(/&([a-zA-Z]+);/g, (raw, name: string) => {
      const key = name.toLowerCase();
      return key === "amp" ? raw : (NAMED_ENTITIES[key] ?? raw);
    })
    .replace(/&amp;/gi, "&");
}

/**
 * HTML 태그를 제거하고 이스케이프 문자를 디코딩해 일반 텍스트로 만듭니다.
 * @param text 정제할 텍스트
 * @returns 디코딩 및 태그 제거된 일반 텍스트
 */
export function cleanHtmlText(text?: string | null): string {
  if (!text) return "";

  let cleaned = text;

  // HTML 태그 제거 및 줄바꿈 처리. 엔티티 디코딩보다 먼저 해야
  // 디코딩으로 생긴 `<제목>` 같은 표기가 태그로 오인돼 지워지지 않는다.
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
  cleaned = cleaned.replace(/<\/p>/gi, "\n");
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 공급처가 이중 인코딩(`&amp;lt;`)해 보내는 경우가 있어 안정될 때까지 반복한다.
  // 반복 횟수를 묶어 병적인 입력에서 멈추지 않는 일이 없게 한다.
  for (let i = 0; i < 3; i += 1) {
    const decoded = decodeEntitiesOnce(cleaned);
    if (decoded === cleaned) break;
    cleaned = decoded;
  }

  // 3개 이상의 연속 줄바꿈(\n\n\n+)을 최대 2개(\n\n)로 제한 및 라인별 여백 정제
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}
