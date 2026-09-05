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

  const disposeSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.removeAllListeners();
    socket.disconnect();
    socketRef.current = null;
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

      const socket = createMatchmakingSocket();
      socketRef.current = socket;

      const emitJoin = () => {
        const payload = joinPayloadRef.current;
        if (!payload) {
          return;
        }

        if (phaseRef.current === "matched") {
          return;
        }

        socket.emit("matchmaking:join", toJoinPayload(payload));
      };

      socket.on("connect", emitJoin);

      socket.on("matchmaking:waiting", (payload) => {
        phaseRef.current = "waiting";
        console.info("matchmaking:waiting", payload);
      });

      socket.on("match_found", (payload) => {
        phaseRef.current = "matched";
        joinLockRef.current = true;
        console.info("match_found", payload);
        setMatch(payload);
      });

      socket.on("connect_error", (error) => {
        console.error("Matchmaking socket error:", error.message);
      });

      socket.connect();
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
    join,
    cancel,
    leave,
  };
}
