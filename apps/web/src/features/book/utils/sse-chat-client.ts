import { AiSearchBookItem, API_PATHS } from "@bookjeok/core";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { redirectToLogin } from "@/shared/utils/session";

export interface StreamAiChatOptions {
  messages: { role: string; content: string }[];
  accessToken?: string | null;
  onSearching?: (message: string) => void;
  onBooks?: (books: AiSearchBookItem[]) => void;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (errorMessage: string) => void;
}

/**
 * AI 대화 및 추천 SSE 엔드포인트와 통신하여 실시간 스트림 이벤트를 파싱하는 네트워크 어댑터
 * 401 만료 시 refreshToken으로 자동 토큰 갱신 후 1회 자동 재시도 (Silent Refresh) 지원
 */
export async function streamAiChat(
  options: StreamAiChatOptions,
  isRetry = false,
): Promise<void> {
  const {
    messages,
    accessToken = useAuthStore.getState().accessToken,
    onSearching,
    onBooks,
    onChunk,
    onDone,
    onError,
  } = options;

  const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${apiBaseURL}${API_PATHS.search.aiStream}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (netErr: unknown) {
    const message = netErr instanceof Error ? netErr.message : String(netErr);
    throw new Error(`Network Error: ${message}`);
  }

  // 401 Unauthorized 발생 시 Silent Refresh & Retry 수행
  if (response.status === 401 && !isRetry) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${apiBaseURL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        if (refreshRes.ok) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await refreshRes.json();

          if (newAccessToken) {
            useAuthStore.getState().setTokens({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || refreshToken,
            });

            // 갱신된 AccessToken으로 1회 재시도
            return await streamAiChat(
              { ...options, accessToken: newAccessToken },
              true,
            );
          }
        }
      } catch (refreshErr) {
        console.error("Failed to refresh token during AI Stream:", refreshErr);
      }
    }

    // Refresh Token도 만료되었거나 없으면 로그아웃 처리 후 예외 발생
    // clearAuth만 하고 SPA에 머무르면 이전 사용자의 쿼리 캐시가 살아남아
    // 같은 브라우저에서 다음 사용자가 로그인할 때 그대로 노출된다.
    useAuthStore.getState().clearAuth();
    redirectToLogin();
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response stream body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let doneReceived = false;

  const processLine = (rawLine: string) => {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("data:")) return;

    const jsonStr = trimmed.replace(/^data:\s*/, "");
    try {
      const data = JSON.parse(jsonStr);

      switch (data.type) {
        case "searching":
          onSearching?.(data.message);
          break;
        case "books":
          if (Array.isArray(data.books)) {
            onBooks?.(data.books);
          }
          break;
        case "text":
          if (data.chunk) {
            onChunk(data.chunk);
          }
          break;
        case "done":
          doneReceived = true;
          onDone();
          break;
        case "error":
          // 문구는 훅에서 로케일에 맞춰 붙인다
          onError(data.message ?? "");
          break;
      }
    } catch (e) {
      console.error("Failed to parse SSE JSON chunk:", jsonStr, e);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      processLine(line);
    }
  }

  if (buffer.trim()) {
    processLine(buffer.trim());
  }

  // 서버가 done 이벤트를 보내지 못한 채 연결이 끊긴 경우에만 안전장치로 호출
  if (!doneReceived) {
    onDone();
  }
}
