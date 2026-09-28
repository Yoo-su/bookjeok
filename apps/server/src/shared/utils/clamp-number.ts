/**
 * 클라이언트가 보낸 숫자 파라미터를 허용 범위 안으로 가둡니다.
 *
 * 음수는 Postgres에서 `LIMIT/OFFSET must not be negative`로 500을 내고,
 * TypeORM의 `take(0)`은 LIMIT 없이 전량 조회가 되며, 상한이 없으면
 * 한 요청이 수만 행을 힙에 올립니다.
 * @param raw 클라이언트가 보낸 값
 * @param fallback 값이 없거나 숫자가 아니거나 0일 때 쓸 기본값
 * @param min 하한
 * @param max 상한
 */
export function clampNumber(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n === 0) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}
