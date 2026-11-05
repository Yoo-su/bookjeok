/** 가로 구간 [시작, 끝](px) */
export type Span = [number, number];

/**
 * 상단바에서 고양이가 멈춰 설 자리의 가운데(px). 로고·메뉴·버튼이 차지한 구간을 피해
 * 몸이 들어가는 빈 틈 중 하나를 넓은 쪽에 가중치를 두어 고른다. 들어갈 틈이 없으면 null
 */
export function pickStopCenter(o: {
  width: number;
  taken: Span[];
  need: number;
  margin: number;
  rand: () => number;
}): number | null {
  const { width, need, margin, rand } = o;
  const spans = [...o.taken]
    .map(([a, b]): Span => [Math.max(0, a), Math.min(width, b)])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const gaps: Span[] = [];
  let at = margin;
  for (const [a, b] of spans) {
    if (a > at) gaps.push([at, a]);
    at = Math.max(at, b);
  }
  if (width - margin > at) gaps.push([at, width - margin]);
  const fit = gaps.filter(([a, b]) => b - a >= need);
  if (!fit.length) return null;
  const room = fit.map(([a, b]) => b - a - need);
  const total = room.reduce((s, v) => s + v + 1, 0);
  let roll = rand() * total;
  for (let i = 0; i < fit.length; i++) {
    roll -= room[i] + 1;
    if (roll <= 0 || i === fit.length - 1) {
      const [a] = fit[i];
      return a + need / 2 + rand() * room[i];
    }
  }
  return null;
}
