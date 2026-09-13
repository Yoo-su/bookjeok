import { HttpStatus } from '@nestjs/common';

import { BusinessException } from '@/shared/exceptions';

/**
 * 커서 조각을 검증 없이 `date`·`uuid` 컬럼 비교에 넣으면 Postgres가 캐스팅
 * 단계에서 실패하고, 그 에러가 400이 아니라 500으로 새어 나간다. 라운지 피드와
 * 독자 목록은 인증 없이 열려 있어 아무나 커서를 지어낼 수 있으므로 쿼리 이전에
 * 형태를 확정한다.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidCursor(): never {
  throw new BusinessException('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, {
    reason: '올바르지 않은 커서 형식입니다.',
  });
}

/**
 * YYYY-MM-DD 형태이면서 달력에 실재하는 날짜인지 확인한다.
 * 정규식만으로는 부족하다. `2026-02-30`은 형태가 맞고 Date가 3월 2일로
 * 굴려 주지만 Postgres는 out of range로 거절한다.
 */
export function assertCursorDate(value: string): void {
  if (!DATE_PATTERN.test(value)) invalidCursor();

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) invalidCursor();
  if (parsed.toISOString().slice(0, 10) !== value) invalidCursor();
}

/** uuid 컬럼 비교에 들어갈 값인지 확인한다. */
export function assertCursorUuid(value: string): void {
  if (!UUID_PATTERN.test(value)) invalidCursor();
}

/** 양의 정수 ID인지 확인하고 숫자로 돌려준다. */
export function parseCursorNumericId(value: string): number {
  if (!/^\d+$/.test(value)) invalidCursor();

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) invalidCursor();

  return parsed;
}

/** `앞부분|뒷부분` 복합 커서를 두 조각으로 가른다. 조각이 비면 거절한다. */
export function splitCompositeCursor(cursor: string): [string, string] {
  const separatorIndex = cursor.indexOf('|');
  if (separatorIndex === -1) invalidCursor();

  const head = cursor.slice(0, separatorIndex);
  const tail = cursor.slice(separatorIndex + 1);
  if (!head || !tail) invalidCursor();

  return [head, tail];
}
