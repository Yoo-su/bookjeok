import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useScrolledPast } from "../use-scrolled-past";

const scrollTo = async (y: number) => {
  await act(async () => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  });
};

afterEach(async () => {
  await scrollTo(0);
});

describe("useScrolledPast", () => {
  it("첫 렌더는 항상 false다 (SSR과 어긋나지 않게)", () => {
    const { result } = renderHook(() => useScrolledPast(300));
    expect(result.current).toBe(false);
  });

  it("기준선을 넘으면 true가 된다", async () => {
    const { result } = renderHook(() => useScrolledPast(300));

    await scrollTo(301);

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("기준선 바로 아래에서는 켜지지 않는다", async () => {
    const { result } = renderHook(() => useScrolledPast(300));

    await scrollTo(300);

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("켜진 뒤에는 해제 기준선까지 내려와야 꺼진다", async () => {
    const { result } = renderHook(() => useScrolledPast(300, 40));

    await scrollTo(320);
    await waitFor(() => expect(result.current).toBe(true));

    // 경계 부근으로 되돌아와도 유지된다. 이 구간이 없으면 전환이 떨린다
    await scrollTo(280);
    await waitFor(() => expect(result.current).toBe(true));

    await scrollTo(255);
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("중간 지점에서 마운트되면(새로고침) 즉시 맞춘다", async () => {
    Object.defineProperty(window, "scrollY", {
      value: 900,
      configurable: true,
    });

    const { result } = renderHook(() => useScrolledPast(300));

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("언마운트 후에는 스크롤을 더 듣지 않는다", async () => {
    const { result, unmount } = renderHook(() => useScrolledPast(300));
    unmount();

    await scrollTo(900);

    expect(result.current).toBe(false);
  });
});
