"use client";

import { chatKeys } from "@bookjeok/core";
import { useMyChatRoomsQuery } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { HIDE_CHAT_WIDGET_ROUTES } from "../constants/routes";
import { resyncRoomMessages } from "../utils/chat-cache-utils";

// 위젯은 마운트 후 로그인 사용자에게만 그려져 서버 렌더에 나오지 않는다.
// 정적 import면 업로드(@vercel/blob → undici)까지 모든 라우트의 서버 번들에 실려 콜드 스타트마다 로드된다
const ChatToggleButton = dynamic(
  () =>
    import("@/features/chat/components/widgets/chat-toggle-button").then(
      (m) => m.ChatToggleButton,
    ),
  { ssr: false },
);
const ChatWidget = dynamic(
  () =>
    import("@/features/chat/components/widgets/chat-widget").then(
      (m) => m.ChatWidget,
    ),
  { ssr: false },
);

/** joinRooms ack 대기 제한 시간 */
const JOIN_ACK_TIMEOUT_MS = 10_000;
/** joinRooms 최대 시도 횟수 */
const MAX_JOIN_ATTEMPTS = 3;
/** joinRooms 재시도 기본 대기 시간 (시도마다 2배씩 증가) */
const JOIN_RETRY_BASE_MS = 1_000;

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isWidgetHidden = (() => {
    if (!pathname) return false;
    const cleanPath = `/${pathname.split("/").slice(2).join("/")}`;
    return HIDE_CHAT_WIDGET_ROUTES.some((route) => cleanPath.startsWith(route));
  })();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? user : null;
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();
  const t = useTranslations("chat");
  const tRef = useRef(t);
  tRef.current = t;
  const hasWarnedJoinFailureRef = useRef(false);
  /** 이 소켓이 한 번이라도 연결된 적이 있는지 (재연결 판별용) */
  const hasConnectedBeforeRef = useRef(false);
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const hasJoinedRooms = useChatStore((state) => state.hasJoinedRooms);
  const setHasJoinedRooms = useChatStore((state) => state.setHasJoinedRooms);
  const { data: rooms, isSuccess: isRoomsLoaded } = useMyChatRoomsQuery({
    enabled: !!user,
  });

  // 방 목록 캐시는 메시지 수신마다 새 배열로 교체되므로 배열 자체를 의존성으로 두면
  // 입장 요청이 불필요하게 재실행된다. 방 ID 집합을 키로 만들어 비교
  const roomIdsKey = (rooms ?? [])
    .map((room) => room.id)
    .sort((a, b) => a - b)
    .join(",");

  /**
   * 재연결 시점에 채팅 캐시를 서버 상태에 맞춰 다시 채웁니다.
   * 끊긴 동안 오간 메시지는 소켓으로 받지 못하고, 메시지 캐시는
   * `staleTime: INFINITY`라 스스로 갱신되지 않습니다.
   */
  const resyncChatCaches = useCallback(() => {
    // 목록(마지막 메시지 · 안 읽음 수)은 전체 재조회
    queryClient.invalidateQueries({ queryKey: chatKeys.rooms.queryKey });

    const { activeChatRoomId } = useChatStore.getState();

    // 닫혀 있는 방의 메시지 캐시는 폐기 (다음에 열 때 새로 조회)
    queryClient.removeQueries({
      queryKey: chatKeys.messages._def,
      predicate: (query) => query.queryKey[2] !== activeChatRoomId,
    });

    if (activeChatRoomId === null) return;

    // 열려 있는 방은 첫 페이지만 남기고 재조회
    resyncRoomMessages(queryClient, activeChatRoomId);
  }, [queryClient]);

  // Effect 1: 이벤트 리스너 생명주기 관리
  useEffect(() => {
    if (user && isConnected && socket) {
      registerChatEventListeners();
      return () => {
        unregisterChatEventListeners();
      };
    }
  }, [
    user,
    isConnected,
    socket,
    registerChatEventListeners,
    unregisterChatEventListeners,
  ]);

  // Effect 2: 재연결 처리
  // isConnected로 조건을 걸면 끊긴 사이 리스너가 해제되어 재연결을 놓치므로
  // 소켓 인스턴스 수명 동안 유지
  useEffect(() => {
    if (!user || !socket) return;

    // 리스너 등록 전에 이미 연결된 상태면 다음 connect는 재연결
    if (socket.connected) {
      hasConnectedBeforeRef.current = true;
    }

    const handleConnect = () => {
      // 소켓 룸 참여는 연결마다 재수행 필요
      setHasJoinedRooms(false);

      if (hasConnectedBeforeRef.current) {
        resyncChatCaches();
      }
      hasConnectedBeforeRef.current = true;
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, socket, setHasJoinedRooms, resyncChatCaches]);

  // Effect 3: 채팅방 입장 처리
  // 입장 실패 시 실시간 메시지를 전혀 받지 못하므로 재시도 후 최종 실패 시 안내
  useEffect(() => {
    if (!isConnected || !socket || !isRoomsLoaded || hasJoinedRooms) {
      return;
    }

    const roomIds = roomIdsKey === "" ? [] : roomIdsKey.split(",").map(Number);
    if (roomIds.length === 0) {
      setHasJoinedRooms(true);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const join = () => {
      socket
        .timeout(JOIN_ACK_TIMEOUT_MS)
        .emit(
          "joinRooms",
          roomIds,
          (
            timeoutError: Error | null,
            response?: { status: string; joinedRooms?: number[] },
          ) => {
            if (cancelled) return;

            if (!timeoutError && response?.status === "ok") {
              hasWarnedJoinFailureRef.current = false;
              setHasJoinedRooms(true);
              return;
            }

            attempt += 1;
            console.error(
              `Failed to join chat rooms (attempt ${attempt}/${MAX_JOIN_ATTEMPTS}):`,
              timeoutError ?? response,
            );

            if (attempt >= MAX_JOIN_ATTEMPTS) {
              // 성공할 때까지 토스트는 한 번만 노출
              if (!hasWarnedJoinFailureRef.current) {
                hasWarnedJoinFailureRef.current = true;
                toast.error(tRef.current("toast.join_failed"));
              }
              return;
            }

            retryTimer = setTimeout(
              join,
              JOIN_RETRY_BASE_MS * 2 ** (attempt - 1),
            );
          },
        );
    };

    join();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    isConnected,
    socket,
    isRoomsLoaded,
    roomIdsKey,
    hasJoinedRooms,
    setHasJoinedRooms,
  ]);

  // Effect 4: 로그아웃 / 연결 해제 시 참여 상태 초기화
  useEffect(() => {
    if (!user || !isConnected) {
      setHasJoinedRooms(false);
    }
    if (!user) {
      hasConnectedBeforeRef.current = false;
    }
  }, [user, isConnected, setHasJoinedRooms]);

  return (
    <>
      {children}
      {currentUser && !isWidgetHidden && (
        <>
          <ChatToggleButton />
          <ChatWidget />
        </>
      )}
    </>
  );
};
