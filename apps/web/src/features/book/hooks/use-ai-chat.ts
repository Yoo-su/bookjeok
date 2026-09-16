"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

import {
  CHAT_STORAGE_KEY,
  ChatMessage,
  INITIAL_WELCOME_MESSAGE,
} from "../constants/ai-chat";
import { streamAiChat } from "../utils/sse-chat-client";

export const useAiChat = () => {
  const t = useTranslations("book.ai_chat");
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  // 첫 인사말만 로케일을 타므로 상수 모양은 두고 문구만 갈아 끼운다
  const welcomeMessage = useMemo(
    () => ({ ...INITIAL_WELCOME_MESSAGE, content: t("welcome") }),
    [t],
  );

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 실크 스무딩 버퍼 (Smooth Token Pacing Queue) Refs
  const streamTargetTextRef = useRef("");
  const streamDisplayedLengthRef = useRef(0);
  const isStreamDoneRef = useRef(false);
  const activeAiMessageIdRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // 유저 ID별로 sessionStorage 키를 격리하여 계정 전환 시 대화 기록 혼선 100% 방지
  const userStorageKey = user
    ? `${CHAT_STORAGE_KEY}_user_${user.id}`
    : `${CHAT_STORAGE_KEY}_guest`;

  // initial state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(userStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      }
    }
    return [welcomeMessage];
  });

  // RAF 기반 부드러운 토큰 드레인 러너
  const startSmoothDrain = useCallback(() => {
    if (rafIdRef.current) return;

    let lastTick = performance.now();

    const tick = (now: number) => {
      const target = streamTargetTextRef.current;
      const currentLength = streamDisplayedLengthRef.current;
      const diff = target.length - currentLength;
      const aiId = activeAiMessageIdRef.current;

      if (diff > 0 && aiId) {
        const elapsed = now - lastTick;
        // ~60fps 주기로 프레임마다 자연스러운 속도로 글자 증가
        if (elapsed >= 16) {
          lastTick = now;
          let step = 2;
          if (isStreamDoneRef.current) {
            // 스트림이 이미 완료된 경우 잔여 버퍼를 신속하게 출력 (최대 1~2프레임 내 완료)
            step = Math.max(8, Math.ceil(diff / 2));
          } else if (diff > 50) {
            step = Math.ceil(diff / 4);
          } else if (diff > 20) {
            step = Math.ceil(diff / 5);
          } else if (diff > 8) {
            step = 3;
          } else {
            step = 2;
          }

          const nextLength = Math.min(currentLength + step, target.length);
          streamDisplayedLengthRef.current = nextLength;
          const sliceText = target.slice(0, nextLength);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiId ? { ...msg, content: sliceText } : msg,
            ),
          );
        }
      }

      // 네트워크 스트림이 끝났고, 버퍼도 모두 출력 완료되었을 때
      if (isStreamDoneRef.current && diff <= 0) {
        if (aiId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiId
                ? {
                    ...msg,
                    isStreaming: false,
                    content: streamTargetTextRef.current || msg.content,
                  }
                : msg,
            ),
          );
        }
        setLoading(false);
        rafIdRef.current = null;
        activeAiMessageIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // 언마운트 시 RAF 정리
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // 로그인 상태 및 사용자 변경 시 해당 계정의 대화 히스토리 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(userStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved chat history:", e);
        }
      }
      setMessages([welcomeMessage]);
    }
  }, [userStorageKey, welcomeMessage]);

  // 대화 변경 시 sessionStorage 동기화 (단, 스트리밍 중인 플래그는 제거 후 저장)
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const cleanMessages = messages.map(({ isStreaming, books, ...rest }) => ({
        ...rest,
        // sessionStorage 용량 절약: 도서 목록은 표시에 필요한 최소 정보만 보존
        ...(books && books.length > 0
          ? {
              books: books.map((b) => ({
                isbn: b.isbn,
                title: b.title,
                author: b.author,
                image: b.image,
                publisher: b.publisher,
                reason: b.reason,
                description: "",
                similarity: 0,
              })),
            }
          : {}),
      }));
      sessionStorage.setItem(userStorageKey, JSON.stringify(cleanMessages));
    }
  }, [messages, userStorageKey, loading]);

  // 대화창 내부 스크롤 (스트리밍 중에는 RAF 기반 즉시 추적하여 버벅임/지터 완전 제거)
  const scrollToBottom = useCallback((smooth = false) => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;

    // 사용자가 위로 스크롤해서 이전 대화를 보고 있는 경우 강제 스크롤 방지
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      180;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // 대화 및 세션 초기화
  const handleClearChat = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    streamTargetTextRef.current = "";
    streamDisplayedLengthRef.current = 0;
    isStreamDoneRef.current = false;
    activeAiMessageIdRef.current = null;

    setMessages([welcomeMessage]);
    setInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(userStorageKey);
    }
  }, [userStorageKey, welcomeMessage]);

  // 메시지 전송 (SSE 스트리밍 + 토큰 페이싱 큐)
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      if (!isLoggedIn) return;

      const queryText = (textToSend || input).trim();
      if (!queryText || loading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: queryText,
      };

      const updatedMessages = [...messages, userMessage];
      const aiMessageId = `ai-${Date.now()}`;
      const placeholderAiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
        statusMessage: t("analyzing"),
      };

      // 버퍼 상태 초기화
      streamTargetTextRef.current = "";
      streamDisplayedLengthRef.current = 0;
      isStreamDoneRef.current = false;
      activeAiMessageIdRef.current = aiMessageId;

      setMessages([...updatedMessages, placeholderAiMessage]);
      setInput("");
      setLoading(true);

      const accessToken = useAuthStore.getState().accessToken;

      try {
        const payloadMessages = updatedMessages
          .filter((m) => m.content && m.content.trim().length > 0)
          .map((m) => {
            let content = m.content;
            // assistant 메시지에 추천 도서 목록이 있으면 히스토리에 포함하여 후속 대화 맥락 유지
            if (m.role === "assistant" && m.books && m.books.length > 0) {
              const bookList = m.books
                .map(
                  (b, i) =>
                    `${i + 1}. 《${b.title}》 - ${b.author}${b.publisher ? ` (${b.publisher})` : ""}`,
                )
                .join("\n");
              content += `\n\n[이전 추천 도서 목록]\n${bookList}`;
            }
            return { role: m.role, content };
          });

        await streamAiChat({
          messages: payloadMessages,
          accessToken,
          onSearching: (statusMsg) => {
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = null;
            }
            streamTargetTextRef.current = "";
            streamDisplayedLengthRef.current = 0;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: "", statusMessage: statusMsg }
                  : msg,
              ),
            );
          },
          onBooks: (books) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      books,
                      statusMessage: t("recommending"),
                    }
                  : msg,
              ),
            );
          },
          onChunk: (chunk) => {
            streamTargetTextRef.current += chunk;
            startSmoothDrain();
          },
          onDone: () => {
            isStreamDoneRef.current = true;
            startSmoothDrain();
          },
          onError: (errMsg) => {
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = null;
            }
            streamTargetTextRef.current = "";
            streamDisplayedLengthRef.current = 0;
            isStreamDoneRef.current = false;
            activeAiMessageIdRef.current = null;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      isStreaming: false,
                      content: errMsg || t("error_temporary"),
                      statusMessage: undefined,
                    }
                  : msg,
              ),
            );
            setLoading(false);
          },
        });
      } catch (error: unknown) {
        console.error("AI Chat Request Failed:", error);
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        streamTargetTextRef.current = "";
        streamDisplayedLengthRef.current = 0;
        isStreamDoneRef.current = false;
        activeAiMessageIdRef.current = null;

        const isUnauthorized =
          (error instanceof Error && error.message === "UNAUTHORIZED") ||
          (typeof error === "object" &&
            error !== null &&
            "response" in error &&
            (error as { response?: { status?: number } }).response?.status ===
              401);
        const errorContent = isUnauthorized
          ? t("login_required")
          : t("error_temporary");

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  isStreaming: false,
                  content: errorContent,
                  statusMessage: undefined,
                }
              : msg,
          ),
        );
        setLoading(false);
      }
    },
    [input, isLoggedIn, loading, messages, startSmoothDrain],
  );

  return {
    user,
    isLoggedIn,
    messages,
    input,
    setInput,
    loading,
    chatContainerRef,
    handleSendMessage,
    handleClearChat,
  };
};
