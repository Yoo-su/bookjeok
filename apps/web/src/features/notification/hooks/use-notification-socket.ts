import { useEffect, useRef } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { useNotificationActions } from "./use-notification-actions";

export const useNotificationSocket = () => {
  const { socket, isConnected } = useSocketContext();
  const { handleNewNotification, syncNotifications } = useNotificationActions();
  const hasConnectedBeforeRef = useRef(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // 소켓 이벤트 연결만 담당
    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, isConnected, handleNewNotification]);

  // 끊긴 사이 저장된 알림 복구. 토스트 없이 목록·개수만 재조회
  // isConnected로 걸면 끊긴 사이 리스너가 해제되므로 소켓 수명 동안 유지
  useEffect(() => {
    if (!socket) return;

    // 리스너 등록 전에 이미 연결된 상태면 다음 connect는 재연결
    if (socket.connected) {
      hasConnectedBeforeRef.current = true;
    }

    const handleConnect = () => {
      if (hasConnectedBeforeRef.current) {
        syncNotifications();
      }
      hasConnectedBeforeRef.current = true;
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, syncNotifications]);
};
