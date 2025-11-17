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

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL!}/chat`, {
        transports: ["websocket"],
        auth: {
          token: accessToken,
        },
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connected", (data) => {
        console.log(data.message);
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error.message);
      });

      setSocket(newSocket);

      return () => {
        console.log("Disconnecting socket...");
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [accessToken]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
