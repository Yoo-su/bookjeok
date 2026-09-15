/**
 * 통화 표기는 로케일마다 자리가 다릅니다.
 * 한국어는 단위가 숫자 뒤(`4,500원`), 영어는 기호가 숫자 앞(`₩4,500`)입니다.
 *
 * 스타일이 다른 마크업이 필요하면 `PriceDisplay`를 쓰고, 문자열이 필요한 곳
 * (공유 설명, 메타데이터 등)에서만 이 함수를 쓰세요.
 */

/** 숫자만 로케일 구분기호로 포맷합니다. */
export function formatAmount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ko-KR").format(
    value,
  );
}

/** 통화 단위가 숫자 앞에 오는 로케일인지 여부. */
export function isUnitPrefixed(locale: string): boolean {
  return locale === "en";
}

/** 숫자와 통화 단위를 로케일 순서에 맞게 이어 붙입니다. */
export function formatCurrency(
  value: number,
  locale: string,
  unit: string,
): string {
  const amount = formatAmount(value, locale);

  return isUnitPrefixed(locale) ? `${unit}${amount}` : `${amount}${unit}`;
}
