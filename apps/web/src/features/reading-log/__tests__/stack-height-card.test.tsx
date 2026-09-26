import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { StackHeightCard } from "@/features/reading-log/components/stack-view/stack-height-card";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

beforeAll(() => {
  // Radix Slider가 크기를 잰다
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function setup(heightCm = 173) {
  const onHeightChange = vi.fn();
  const utils = render(
    <StackHeightCard
      heightCm={heightCm}
      isDefaultHeight={false}
      character="M"
      onHeightChange={onHeightChange}
      onCharacterChange={vi.fn()}
    />,
  );
  const input = screen.getByLabelText("height_label");
  return { ...utils, input, onHeightChange };
}

describe("StackHeightCard 키 입력", () => {
  it("입력 중간값(16)에는 오류를 띄우지 않고 완성된 값만 반영한다", () => {
    const { input, onHeightChange } = setup();

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "16" } });
    expect(screen.queryByText("height_error")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");

    fireEvent.change(input, { target: { value: "165" } });
    expect(onHeightChange).toHaveBeenCalledTimes(1);
    expect(onHeightChange).toHaveBeenCalledWith(165);
  });

  it("범위를 벗어난 채로 벗어나면 오류를 띄우고 입력칸과 잇는다", () => {
    const { input, onHeightChange } = setup();

    fireEvent.change(input, { target: { value: "16" } });
    fireEvent.blur(input);

    expect(screen.getByText("height_error")).toHaveAttribute(
      "id",
      "stack-height-error",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "stack-height-error");
    expect(onHeightChange).not.toHaveBeenCalled();
  });

  it("버튼 등으로 키가 바뀌면 입력칸과 오류 표시를 되돌린다", () => {
    const { input, rerender } = setup();
    fireEvent.change(input, { target: { value: "16" } });
    fireEvent.blur(input);
    expect(screen.getByText("height_error")).toBeInTheDocument();

    rerender(
      <StackHeightCard
        heightCm={174}
        isDefaultHeight={false}
        character="M"
        onHeightChange={vi.fn()}
        onCharacterChange={vi.fn()}
      />,
    );

    expect(screen.queryByText("height_error")).not.toBeInTheDocument();
    expect(input).toHaveValue(174);
  });
});
