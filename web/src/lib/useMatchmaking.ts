"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMatchmakingSocket,
  toJoinPayload,
  type GenderPreference,
  type MatchFoundPayload,
  type MatchmakingSocket,
  type UserGender,
  type ChatMode,
} from "./socket";

export type MatchmakingJoinInput = {
  mode: ChatMode;
  preference: GenderPreference;
  gender?: UserGender;
};

export function useMatchmaking() {
  const socketRef = useRef<MatchmakingSocket | null>(null);
  const joinLockRef = useRef(false);
  const phaseRef = useRef<"idle" | "joining" | "waiting" | "matched">("idle");
  const joinPayloadRef = useRef<MatchmakingJoinInput | null>(null);
  const [match, setMatch] = useState<MatchFoundPayload | null>(null);
  const [socket, setSocket] = useState<MatchmakingSocket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  const disposeSocket = useCallback(() => {
    const current = socketRef.current;
    if (!current) {
      return;
    }

    current.removeAllListeners();
    current.disconnect();
    socketRef.current = null;
    setSocket(null);
    setSocketId(null);
  }, []);

  const reset = useCallback(() => {
    joinLockRef.current = false;
    phaseRef.current = "idle";
    joinPayloadRef.current = null;
    setMatch(null);
  }, []);

  const cancel = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("matchmaking:cancel");
    }

    disposeSocket();
    reset();
  }, [disposeSocket, reset]);

  const leave = useCallback(() => {
    disposeSocket();
    reset();
  }, [disposeSocket, reset]);

  const join = useCallback(
    (input: MatchmakingJoinInput) => {
      if (joinLockRef.current) {
        return;
      }

      joinLockRef.current = true;
      phaseRef.current = "joining";
      joinPayloadRef.current = input;
      setMatch(null);

      disposeSocket();

      const nextSocket = createMatchmakingSocket();
      socketRef.current = nextSocket;
      setSocket(nextSocket);

      const emitJoin = () => {
        const payload = joinPayloadRef.current;
        if (!payload) {
          return;
        }

        if (phaseRef.current === "matched") {
          return;
        }

        setSocketId(nextSocket.id ?? null);
        nextSocket.emit("matchmaking:join", toJoinPayload(payload));
      };

      nextSocket.on("connect", emitJoin);

      nextSocket.on("matchmaking:waiting", (payload) => {
        phaseRef.current = "waiting";
        console.info("matchmaking:waiting", payload);
      });

      nextSocket.on("match_found", (payload) => {
        phaseRef.current = "matched";
        joinLockRef.current = true;
        console.info("match_found", payload);
        setMatch(payload);
      });

      nextSocket.on("connect_error", (error) => {
        console.error("Matchmaking socket error:", error.message);
      });

      nextSocket.connect();
    },
    [disposeSocket],
  );

  useEffect(() => {
    return () => {
      disposeSocket();
    };
  }, [disposeSocket]);

  return {
    match,
    socket,
    socketId,
    join,
    cancel,
    leave,
  };
}
