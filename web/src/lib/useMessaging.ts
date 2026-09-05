"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  parseMessageReceived,
  type MatchFoundPayload,
  type MatchmakingSocket,
  type MessageReceivedPayload,
} from "./socket";

export type ChatMessage = MessageReceivedPayload & {
  fromSelf: boolean;
};

type UseMessagingOptions = {
  socket: MatchmakingSocket | null;
  socketId: string | null;
  match: MatchFoundPayload | null;
  enabled: boolean;
};

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }

    return a.messageId.localeCompare(b.messageId);
  });
}

export function useMessaging({
  socket,
  socketId,
  match,
  enabled,
}: UseMessagingOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [canSend, setCanSend] = useState(false);
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !socket || !match) {
      matchIdRef.current = null;
      setMessages([]);
      setCanSend(false);
      return;
    }

    const currentSocket = socket;
    const matchId = match.matchId;
    const peerSocketId = match.peerSocketId;
    matchIdRef.current = matchId;
    setMessages([]);
    setCanSend(currentSocket.connected);

    const onReceived = (raw: MessageReceivedPayload) => {
      const payload = parseMessageReceived(raw);
      if (!payload || payload.matchId !== matchIdRef.current) {
        return;
      }

      setMessages((current) => {
        if (current.some((message) => message.messageId === payload.messageId)) {
          return current;
        }

        return sortMessages([
          ...current,
          {
            ...payload,
            fromSelf: payload.senderSocketId === socketId,
          },
        ]);
      });
    };

    const onDisconnect = () => {
      setCanSend(false);
    };

    const onPeerLeft = (payload: { peerSocketId: string }) => {
      if (payload.peerSocketId !== peerSocketId) {
        return;
      }

      setCanSend(false);
    };

    currentSocket.on("message:received", onReceived);
    currentSocket.on("disconnect", onDisconnect);
    currentSocket.on("webrtc:peer-left", onPeerLeft);

    return () => {
      currentSocket.off("message:received", onReceived);
      currentSocket.off("disconnect", onDisconnect);
      currentSocket.off("webrtc:peer-left", onPeerLeft);
      matchIdRef.current = null;
      setMessages([]);
      setCanSend(false);
    };
  }, [enabled, match, socket, socketId]);

  const sendMessage = useCallback(
    (rawText: string) => {
      if (!enabled || !socket?.connected || !match || !canSend) {
        return false;
      }

      const text = rawText.trim();
      if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
        return false;
      }

      socket.emit("message:send", {
        matchId: match.matchId,
        text,
      });
      return true;
    },
    [canSend, enabled, match, socket],
  );

  return {
    messages,
    canSend,
    sendMessage,
  };
}
