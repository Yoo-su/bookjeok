import { clampNumber } from './clamp-number';

describe('clampNumber', () => {
  it('범위 안의 값은 정수로 그대로 쓴다', () => {
    expect(clampNumber('20', 10, 1, 50)).toBe(20);
    expect(clampNumber(7.9, 10, 1, 50)).toBe(7);
  });

  it('없거나 숫자가 아니거나 0이면 기본값', () => {
    expect(clampNumber(undefined, 10, 1, 50)).toBe(10);
    expect(clampNumber('abc', 10, 1, 50)).toBe(10);
    expect(clampNumber(0, 10, 1, 50)).toBe(10);
  });

  it('범위를 벗어나면 경계로 가둔다', () => {
    expect(clampNumber(-5, 10, 1, 50)).toBe(1);
    expect(clampNumber(100000, 10, 1, 50)).toBe(50);
  });
});
