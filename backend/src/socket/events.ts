import type {
  MessagingClientToServerEvents,
  MessagingServerToClientEvents,
} from "../messaging/types.js";
import type {
  ClientToServerEvents as MatchmakingClientToServerEvents,
  ServerToClientEvents as MatchmakingServerToClientEvents,
} from "../matchmaking/types.js";
import type {
  SignalingClientToServerEvents,
  SignalingServerToClientEvents,
} from "../signaling/types.js";

export type ClientToServerEvents = MatchmakingClientToServerEvents &
  SignalingClientToServerEvents &
  MessagingClientToServerEvents;

export type ServerToClientEvents = MatchmakingServerToClientEvents &
  SignalingServerToClientEvents &
  MessagingServerToClientEvents;
