import * as apis from "@bookjeok/api-client";
import { NotificationType } from "@bookjeok/core";
import { useUnreadCountQuery } from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationSocket } from "@/features/notification/hooks/use-notification-socket";

type Handler = (...args: unknown[]) => void;

const socketState = vi.hoisted(() => ({
  socket: null as unknown,
  isConnected: false,
}));

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getUnreadNotificationCount: vi.fn(),
}));
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => socketState,
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

const createSocket = () => {
  const handlers = new Map<string, Set<Handler>>();
  return {
    connected: false,
    on: vi.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: Handler) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((handler) => handler(...args));
    },
  };
};

const getUnreadCount = vi.mocked(apis.getUnreadNotificationCount);

const renderBadge = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(
    () => {
      useNotificationSocket();
      return useUnreadCountQuery();
    },
    { wrapper },
  );
};

describe("notification reconnect sync", () => {
  let socket: ReturnType<typeof createSocket>;

  beforeEach(() => {
    socket = createSocket();
    socketState.socket = socket;
    socketState.isConnected = false;
  });

  afterEach(() => {
    getUnreadCount.mockReset();
    vi.mocked(toast.info).mockReset();
  });

  it("refetches the unread count after a reconnect without a toast", async () => {
    getUnreadCount.mockResolvedValueOnce(1).mockResolvedValueOnce(3);
    const { result, rerender } = renderBadge();

    act(() => {
      socket.connected = true;
      socketState.isConnected = true;
      socket.emit("connect");
    });
    rerender();
    await waitFor(() => expect(result.current.data).toBe(1));
    expect(getUnreadCount).toHaveBeenCalledTimes(1);

    // 끊긴 사이 서버에 알림 2건 저장
    act(() => {
      socket.connected = false;
      socketState.isConnected = false;
      socket.emit("disconnect");
    });
    rerender();
    act(() => {
      socket.connected = true;
      socketState.isConnected = true;
      socket.emit("connect");
    });
    rerender();

    await waitFor(() => expect(result.current.data).toBe(3));
    expect(getUnreadCount).toHaveBeenCalledTimes(2);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("does not refetch on the first connect", async () => {
    getUnreadCount.mockResolvedValue(1);
    const { result, rerender } = renderBadge();
    await waitFor(() => expect(result.current.data).toBe(1));

    act(() => {
      socket.connected = true;
      socketState.isConnected = true;
      socket.emit("connect");
    });
    rerender();

    expect(getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("still shows a toast and refetches for a live notification", async () => {
    getUnreadCount.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const { result, rerender } = renderBadge();
    act(() => {
      socket.connected = true;
      socketState.isConnected = true;
      socket.emit("connect");
    });
    rerender();
    await waitFor(() => expect(result.current.data).toBe(0));

    act(() => {
      socket.emit("newNotification", {
        id: 1,
        type: NotificationType.COMMENT_LIKE,
        isRead: false,
        metadata: {},
        createdAt: new Date().toISOString(),
      });
    });

    await waitFor(() => expect(result.current.data).toBe(1));
    expect(toast.info).toHaveBeenCalledTimes(1);
  });
});
