import { io, type Socket } from "socket.io-client";
import { publicEnv } from "./env";

export type ChatMode = "text" | "voice" | "video";
export type GenderPreference = "any" | "male" | "female";
export type UserGender = "male" | "female";

export type MatchmakingJoinPayload = {
  mode: ChatMode;
  preference?: GenderPreference;
  gender?: UserGender;
};

export type MatchmakingWaitingPayload = {
  mode: ChatMode;
};

export type MatchFoundPayload = {
  matchId: string;
  peerSocketId: string;
  mode: ChatMode;
};

export type MatchmakingCancelledPayload = {
  mode?: ChatMode;
};

export type MatchmakingErrorPayload = {
  code: "own_gender_required";
  message: string;
};

export type SignalingDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type SignalingIceCandidate = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

export type WebRtcOfferPayload = {
  to: string;
  description: SignalingDescription;
};

export type WebRtcAnswerPayload = {
  to: string;
  description: SignalingDescription;
};

export type WebRtcIceCandidatePayload = {
  to: string;
  candidate: SignalingIceCandidate;
};

export type WebRtcOfferIncoming = {
  from: string;
  description: SignalingDescription;
};

export type WebRtcAnswerIncoming = {
  from: string;
  description: SignalingDescription;
};

export type WebRtcIceCandidateIncoming = {
  from: string;
  candidate: SignalingIceCandidate;
};

export type WebRtcPeerLeftPayload = {
  peerSocketId: string;
};

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

export type ClientToServerEvents = {
  "matchmaking:join": (payload: MatchmakingJoinPayload) => void;
  "matchmaking:cancel": () => void;
  "webrtc:offer": (payload: WebRtcOfferPayload) => void;
  "webrtc:answer": (payload: WebRtcAnswerPayload) => void;
  "webrtc:ice-candidate": (payload: WebRtcIceCandidatePayload) => void;
  "message:send": (payload: MessageSendPayload) => void;
};

export type ServerToClientEvents = {
  "matchmaking:waiting": (payload: MatchmakingWaitingPayload) => void;
  match_found: (payload: MatchFoundPayload) => void;
  "matchmaking:cancelled": (payload: MatchmakingCancelledPayload) => void;
  "matchmaking:error": (payload: MatchmakingErrorPayload) => void;
  "webrtc:offer": (payload: WebRtcOfferIncoming) => void;
  "webrtc:answer": (payload: WebRtcAnswerIncoming) => void;
  "webrtc:ice-candidate": (payload: WebRtcIceCandidateIncoming) => void;
  "webrtc:peer-left": (payload: WebRtcPeerLeftPayload) => void;
  "message:received": (payload: MessageReceivedPayload) => void;
};

export function isMessagingMode(mode: ChatMode): mode is MessagingMode {
  return (MESSAGING_MODES as readonly string[]).includes(mode);
}

export function parseMessageReceived(
  raw: unknown,
): MessageReceivedPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<MessageReceivedPayload>;
  if (typeof payload.messageId !== "string" || payload.messageId.length === 0) {
    return null;
  }

  if (typeof payload.matchId !== "string" || payload.matchId.length === 0) {
    return null;
  }

  if (
    typeof payload.senderSocketId !== "string" ||
    payload.senderSocketId.length === 0
  ) {
    return null;
  }

  if (typeof payload.text !== "string") {
    return null;
  }

  if (typeof payload.timestamp !== "number" || !Number.isFinite(payload.timestamp)) {
    return null;
  }

  return {
    messageId: payload.messageId,
    matchId: payload.matchId,
    senderSocketId: payload.senderSocketId,
    text: payload.text,
    timestamp: payload.timestamp,
  };
}

export type MatchmakingSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export function getSocketUrl(): string {
  return publicEnv.socketUrl.replace(/\/$/, "");
}

export function toJoinPayload(input: {
  mode: ChatMode;
  preference: GenderPreference;
}): MatchmakingJoinPayload {
  return {
    mode: input.mode,
    preference: input.preference,
  };
}

export function createMatchmakingSocket(
  getAccessToken?: () => Promise<string | null>,
): MatchmakingSocket {
  if (typeof window === "undefined") {
    throw new Error("Matchmaking socket can only be created in the browser");
  }

  return io(getSocketUrl(), {
    autoConnect: false,
    reconnection: true,
    auth: (callback: (data: Record<string, string>) => void) => {
      if (!getAccessToken) {
        callback({});
        return;
      }

      void getAccessToken()
        .then((token) => {
          callback(token ? { token } : {});
        })
        .catch(() => {
          callback({});
        });
    },
  });
}
