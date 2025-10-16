import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { BackendPacientResponse } from "@/lib/api";
import type { PatientWithId } from "../types";

export const useSocket = (url: string = "https://localhost:3001") => {
  const [isConnected, setIsConnected] = useState(false);
  const [last10Data, setLast10Data] = useState<PatientWithId[]>([]);
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

    socketRef.current.on("last10", (data: BackendPacientResponse[]) => {
      setLast10Data(
        data.map((item) => ({
          id: item.id,
          name: item.firstName,
          lastName: item.lastName,
          dateOfBirth: new Date(item.birthDate),
        })),
      );
    });

    // Error handling
    socketRef.current.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url]);

  // Function to request all patients
  const requestAllPatients = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("requestAllPatients");
    }
  }, [isConnected]);

  return { isConnected, last10Data, requestAllPatients };
};
