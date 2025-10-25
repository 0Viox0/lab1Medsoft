import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { EncounterResponseDto } from "../types";

export const useSocket = (url: string = "https://localhost:3002") => {
  const [isConnected, setIsConnected] = useState(false);
  const [visits, setVisits] = useState<EncounterResponseDto[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("visits", (data: EncounterResponseDto[]) => {
      setVisits(data);
    });

    socketRef.current.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url]);

  const requestAllVisits = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("requestAllVisits");
    }
  }, [isConnected]);

  return { isConnected, visits, requestAllVisits };
};
