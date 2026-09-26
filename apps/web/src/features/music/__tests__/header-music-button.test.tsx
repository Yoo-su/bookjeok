import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderMusicButton } from "../components/header-music-button";
import { useMusicStore } from "../stores/use-music-store";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("HeaderMusicButton", () => {
  beforeEach(() => {
    useMusicStore.setState({ isPlaying: false, isModalOpen: false });
  });

  it("renders a single icon button that opens the player", () => {
    render(<HeaderMusicButton />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName("header_button.aria_label");

    fireEvent.click(buttons[0]);
    expect(useMusicStore.getState().isModalOpen).toBe(true);
  });

  it("spins the disc only while playing", () => {
    const { container, rerender } = render(<HeaderMusicButton />);
    expect(container.querySelector("svg")).not.toHaveClass("animate-spin");

    useMusicStore.setState({ isPlaying: true });
    rerender(<HeaderMusicButton />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });
});
