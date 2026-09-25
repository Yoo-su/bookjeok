import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SocketProvider, useSocketContext } from "./socket-provider";

const { io, fakeSocket } = vi.hoisted(() => {
  const fakeSocket = { on: vi.fn(), disconnect: vi.fn() };
  return { io: vi.fn(() => fakeSocket), fakeSocket };
});

vi.mock("socket.io-client", () => ({ io }));

let accessToken: string | null = "token";
vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (
    selector: (state: { accessToken: string | null }) => unknown,
  ) => selector({ accessToken }),
}));

function Probe() {
  const { socket } = useSocketContext();
  return <span>{socket ? "socket" : "none"}</span>;
}

const renderProvider = () =>
  render(
    <SocketProvider namespace="/chat">
      <Probe />
    </SocketProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  accessToken = "token";
});

describe("SocketProvider", () => {
  it("토큰이 있으면 라이브러리를 불러와 연결하고 해제 시 끊는다", async () => {
    const { unmount } = renderProvider();

    await waitFor(() => expect(screen.getByText("socket")).toBeInTheDocument());
    expect(io).toHaveBeenCalledWith(
      expect.stringMatching(/\/chat$/),
      expect.objectContaining({ auth: { token: "token" } }),
    );

    unmount();
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("불러오기 전에 언마운트되면 연결하지 않는다", async () => {
    const { unmount } = renderProvider();
    unmount();

    // 동적 import가 끝날 때까지 기다린다
    await import("socket.io-client");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(io).not.toHaveBeenCalled();
  });

  it("토큰이 없으면 연결하지 않는다", async () => {
    accessToken = null;
    renderProvider();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(io).not.toHaveBeenCalled();
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
