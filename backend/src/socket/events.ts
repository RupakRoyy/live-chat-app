import type {
  ClientToServerEvents as MatchmakingClientToServerEvents,
  ServerToClientEvents as MatchmakingServerToClientEvents,
} from "../matchmaking/types.js";
import type {
  SignalingClientToServerEvents,
  SignalingServerToClientEvents,
} from "../signaling/types.js";

export type ClientToServerEvents = MatchmakingClientToServerEvents &
  SignalingClientToServerEvents;

export type ServerToClientEvents = MatchmakingServerToClientEvents &
  SignalingServerToClientEvents;
