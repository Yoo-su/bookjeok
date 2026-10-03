/**
 * ChatProvider의 채팅방 입장(joinRooms) 처리 검증.
 * 입장 실패 시 재시도가 수행되는지, 최종 실패 시 사용자에게 안내하는지 확인한다.
 */
import { chatKeys } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import React, { act } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatProvider } from "@/features/chat/providers/chat-provider";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/ko" }));

// 실제 쿼리 캐시처럼 렌더 간 동일한 배열 참조 유지
const mockRooms = [{ id: 1 }, { id: 2 }];
vi.mock("@bookjeok/react-query", () => ({
  useMyChatRoomsQuery: () => ({ data: mockRooms, isSuccess: true }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: number } }) => unknown) =>
    selector({ user: { id: 1 } }),
}));

vi.mock("@/features/chat/hooks/use-chat-events", () => ({
  useChatEvents: () => ({
    registerChatEventListeners: vi.fn(),
    unregisterChatEventListeners: vi.fn(),
  }),
}));

vi.mock("@/features/chat/components/widgets/chat-widget", () => ({
  ChatWidget: () => null,
}));

const mockEmit = vi.fn();
const socketListeners: Record<string, ((...args: unknown[]) => void)[]> = {};
const mockOn = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
  (socketListeners[event] ??= []).push(handler);
});
const mockOff = vi.fn(
  (event: string, handler: (...args: unknown[]) => void) => {
    socketListeners[event] = (socketListeners[event] ?? []).filter(
      (registered) => registered !== handler,
    );
  },
);
/** 소켓 이벤트 발생 상황 모사 */
const emitSocketEvent = (event: string) => {
  [...(socketListeners[event] ?? [])].forEach((handler) => handler());
};
// 실제 SocketProvider의 socket은 useState 값이라 렌더 간 참조가 동일
const mockSocket = {
  timeout: () => ({ emit: mockEmit }),
  connected: false,
  on: mockOn,
  off: mockOff,
};
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({ socket: mockSocket, isConnected: true }),
}));

let queryClient: QueryClient;

/** ChatProvider는 캐시를 직접 다루므로 실제 QueryClient 필요 */
const renderProvider = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ChatProvider>{null}</ChatProvider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  Object.keys(socketListeners).forEach((key) => delete socketListeners[key]);
  mockSocket.connected = false;
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  useChatStore.setState({ hasJoinedRooms: false, activeChatRoomId: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatProvider joinRooms", () => {
  it("입장에 성공하면 한 번만 요청하고 참여 상태로 표시한다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(null, { status: "ok", joinedRooms: [1, 2] });
    });

    renderProvider();

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit.mock.calls[0][1]).toEqual([1, 2]);
    expect(useChatStore.getState().hasJoinedRooms).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("실패하면 백오프로 재시도하고, 모두 실패하면 사용자에게 알린다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(null, { status: "error" });
    });

    renderProvider();

    // 1회차 실패 후 1초 뒤 재시도
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);

    // 2회차 실패 후 2초 뒤 마지막 시도
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(3);

    // 최대 시도 횟수 소진 → 안내 후 중단
    expect(toast.error).toHaveBeenCalledWith("chat.toast.join_failed");
    expect(useChatStore.getState().hasJoinedRooms).toBe(false);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(3);
  });

  it("ack 타임아웃도 실패로 처리해 재시도한다", () => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(new Error("operation has timed out"));
    });

    renderProvider();
    expect(mockEmit).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);
  });
});

/**
 * 끊긴 동안 온 메시지는 소켓으로 받지 못하고 메시지 캐시도 staleTime이 무한이라
 * 갱신되지 않으므로, 재연결 시점에 캐시를 서버와 다시 맞추는지 확인한다.
 */
describe("ChatProvider 재연결 동기화", () => {
  const ACTIVE_ROOM_ID = 1;
  const OTHER_ROOM_ID = 2;

  const seedMessageCaches = () => {
    queryClient.setQueryData(chatKeys.messages(ACTIVE_ROOM_ID).queryKey, {
      // 과거 페이지가 앞에, 첫 페이지가 뒤에 오는 실제 구조
      pages: [{ messages: [{ id: 1 }] }, { messages: [{ id: 2 }] }],
      pageParams: [10, undefined],
    });
    queryClient.setQueryData(chatKeys.messages(OTHER_ROOM_ID).queryKey, {
      pages: [{ messages: [{ id: 3 }] }],
      pageParams: [undefined],
    });
    queryClient.setQueryData(chatKeys.rooms.queryKey, mockRooms);
  };

  beforeEach(() => {
    mockEmit.mockImplementation((_event, _roomIds, ack) => {
      ack(null, { status: "ok", joinedRooms: [1, 2] });
    });
  });

  it("첫 연결에서는 캐시를 건드리지 않는다", () => {
    useChatStore.setState({ activeChatRoomId: ACTIVE_ROOM_ID });
    renderProvider();
    seedMessageCaches();

    act(() => {
      emitSocketEvent("connect");
    });

    expect(
      queryClient.getQueryData(chatKeys.messages(ACTIVE_ROOM_ID).queryKey),
    ).toMatchObject({
      pages: [{ messages: [{ id: 1 }] }, { messages: [{ id: 2 }] }],
    });
    expect(
      queryClient.getQueryData(chatKeys.messages(OTHER_ROOM_ID).queryKey),
    ).toBeDefined();
  });

  it("재연결되면 열린 방은 첫 페이지만 남기고 다른 방 캐시는 버린다", () => {
    useChatStore.setState({ activeChatRoomId: ACTIVE_ROOM_ID });
    renderProvider();
    seedMessageCaches();

    act(() => {
      emitSocketEvent("connect"); // 최초 연결
    });
    act(() => {
      emitSocketEvent("connect"); // 재연결
    });

    // 열려 있는 방: 커서 없는 첫 페이지만 남아 다시 받아올 수 있는 상태
    expect(
      queryClient.getQueryData(chatKeys.messages(ACTIVE_ROOM_ID).queryKey),
    ).toMatchObject({
      pages: [{ messages: [{ id: 2 }] }],
      pageParams: [undefined],
    });
    // 닫혀 있는 방: 다음에 열 때 새로 받도록 캐시를 비운다
    expect(
      queryClient.getQueryData(chatKeys.messages(OTHER_ROOM_ID).queryKey),
    ).toBeUndefined();
    // 목록도 다시 받도록 무효화된다
    expect(
      queryClient.getQueryState(chatKeys.rooms.queryKey)?.isInvalidated,
    ).toBe(true);
  });

  it("재연결되면 방 입장을 다시 시도한다", () => {
    renderProvider();

    act(() => {
      emitSocketEvent("connect"); // 최초 연결
    });
    const joinCountBeforeReconnect = mockEmit.mock.calls.length;

    act(() => {
      emitSocketEvent("connect"); // 재연결
    });

    // 연결마다 소켓 룸에 재입장해야 실시간 메시지 수신이 유지된다
    expect(mockEmit.mock.calls.length).toBe(joinCountBeforeReconnect + 1);
    expect(useChatStore.getState().hasJoinedRooms).toBe(true);
  });
});
