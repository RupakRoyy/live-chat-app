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

export type ClientToServerEvents = {
  "matchmaking:join": (payload: MatchmakingJoinPayload) => void;
  "matchmaking:cancel": () => void;
};

export type ServerToClientEvents = {
  "matchmaking:waiting": (payload: MatchmakingWaitingPayload) => void;
  match_found: (payload: MatchFoundPayload) => void;
  "matchmaking:cancelled": (payload: MatchmakingCancelledPayload) => void;
};

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
  gender?: UserGender;
}): MatchmakingJoinPayload {
  const payload: MatchmakingJoinPayload = {
    mode: input.mode,
    preference: input.preference,
  };

  if (input.gender) {
    payload.gender = input.gender;
  }

  return payload;
}

export function createMatchmakingSocket(): MatchmakingSocket {
  if (typeof window === "undefined") {
    throw new Error("Matchmaking socket can only be created in the browser");
  }

  return io(getSocketUrl(), {
    autoConnect: false,
    reconnection: true,
  });
}
