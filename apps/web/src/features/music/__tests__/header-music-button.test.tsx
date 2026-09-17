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

  it("renders the label and quick-play control in the full variant", () => {
    render(<HeaderMusicButton />);

    expect(screen.getByText("header_button.label")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "controls.play" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "header_button.aria_label" }),
    ).toHaveClass("w-21");
  });

  it("keeps the player entry point while omitting wide controls when compact", () => {
    render(<HeaderMusicButton compact />);

    const openPlayer = screen.getByRole("button", {
      name: "header_button.aria_label",
    });

    expect(screen.queryByText("header_button.label")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "controls.play" }),
    ).not.toBeInTheDocument();
    expect(openPlayer).toHaveClass("w-8.5");

    fireEvent.click(openPlayer);
    expect(useMusicStore.getState().isModalOpen).toBe(true);
  });
});
