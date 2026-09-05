export const MAX_MESSAGE_LENGTH = 2000;

export const MESSAGING_MODES = ["text", "video"] as const;
export type MessagingMode = (typeof MESSAGING_MODES)[number];

export type MessageSendPayload = {
  matchId: string;
  text: string;
};

export type MessageReceivedPayload = {
  messageId: string;
  matchId: string;
  senderSocketId: string;
  text: string;
  timestamp: number;
};

export interface MessagingClientToServerEvents {
  "message:send": (payload: MessageSendPayload) => void;
}

export interface MessagingServerToClientEvents {
  "message:received": (payload: MessageReceivedPayload) => void;
}

export function isMessagingMode(value: unknown): value is MessagingMode {
  return (
    typeof value === "string" &&
    (MESSAGING_MODES as readonly string[]).includes(value)
  );
}

export function parseSendPayload(raw: unknown): MessageSendPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<MessageSendPayload>;
  if (typeof payload.matchId !== "string" || payload.matchId.length === 0) {
    return null;
  }

  if (typeof payload.text !== "string") {
    return null;
  }

  const text = payload.text.trim();
  if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
    return null;
  }

  return {
    matchId: payload.matchId,
    text,
  };
}
