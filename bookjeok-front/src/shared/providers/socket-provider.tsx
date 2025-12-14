"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useAuthStore } from "@/features/auth/store";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({
  children,
  namespace,
}: {
  children: React.ReactNode;
  namespace: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL!}${namespace}`, {
        transports: ["websocket"],
        auth: {
          token: accessToken,
        },
        reconnection: true, // 자동 재연결 활성화
        reconnectionAttempts: 1, // 최대 1회 시도
      });

      newSocket.on("connect", () => {
        console.log(`Socket connected to ${namespace}:`, newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log(`Socket disconnected from ${namespace}`);
        setIsConnected(false);
      });

      newSocket.on("connected", (data) => {
        console.log(data.message);
      });

      newSocket.on("error", (error) => {
        console.error(`Socket error on ${namespace}:`, error.message);
      });

      setSocket(newSocket);

      return () => {
        console.log(`Disconnecting socket from ${namespace}...`);
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [accessToken, namespace]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
