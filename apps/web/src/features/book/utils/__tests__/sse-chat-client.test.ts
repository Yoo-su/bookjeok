import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import { streamAiChat } from "../sse-chat-client";

vi.mock("@/shared/utils/session", () => ({
  redirectToLogin: vi.fn(),
}));

const sseBody = (...events: object[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        for (const event of events) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        }
        controller.close();
      },
    }),
    { status: 200 },
  );

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("streamAiChat 토큰 갱신", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    useAuthStore.getState().setTokens({
      accessToken: "expired",
      refreshToken: "refresh-1",
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("401이면 봉투({ success, data })를 벗겨 새 토큰으로 한 번 재시도한다", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { accessToken: "fresh", refreshToken: "refresh-2" },
          timestamp: "2026-09-28T00:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(sseBody({ type: "done" }));

    const onDone = vi.fn();
    await streamAiChat({
      messages: [{ role: "user", content: "추천해 줘" }],
      accessToken: "expired",
      onChunk: vi.fn(),
      onDone,
      onError: vi.fn(),
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = fetchMock.mock.calls[2][1].headers;
    expect(retryHeaders.Authorization).toBe("Bearer fresh");
    expect(useAuthStore.getState().accessToken).toBe("fresh");
    expect(useAuthStore.getState().refreshToken).toBe("refresh-2");
    expect(onDone).toHaveBeenCalled();
  });

  it("갱신이 실패하면 로그아웃하고 UNAUTHORIZED를 던진다", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ success: false }, 401));

    await expect(
      streamAiChat({
        messages: [{ role: "user", content: "추천해 줘" }],
        accessToken: "expired",
        onChunk: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
      }),
    ).rejects.toThrow("UNAUTHORIZED");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
