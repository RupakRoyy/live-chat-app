export const CHAT_MODES = ["text", "voice", "video"] as const;
export type ChatMode = (typeof CHAT_MODES)[number];

export const USER_GENDERS = ["male", "female"] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export const GENDER_PREFERENCES = ["any", "male", "female"] as const;
export type GenderPreference = (typeof GENDER_PREFERENCES)[number];

export type MatchmakingJoinPayload = {
  mode: ChatMode;
  /** Who this user wants to match with. Defaults to `any`. */
  preference?: GenderPreference;
  /**
   * Ignored if present. Own gender is loaded from the authenticated
   * profile record and is never taken from the client.
   */
  gender?: UserGender;
};

export const MATCHMAKING_ERROR_CODES = ["own_gender_required"] as const;
export type MatchmakingErrorCode = (typeof MATCHMAKING_ERROR_CODES)[number];

export type MatchmakingErrorPayload = {
  code: MatchmakingErrorCode;
  message: string;
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

export type WaitingUser = {
  socketId: string;
  mode: ChatMode;
  preference: GenderPreference;
  /** Server-sourced own gender. Never taken from the join payload. */
  gender?: UserGender;
  /** Verified Clerk user id when the socket is authenticated. */
  userId?: string;
  joinedAt: number;
};

export type StoredMatch = {
  matchId: string;
  mode: ChatMode;
  peerSocketId: string;
};

export type MatchPair = {
  matchId: string;
  mode: ChatMode;
  users: [WaitingUser, WaitingUser];
};

export type JoinQueueResult =
  | { status: "waiting"; user: WaitingUser }
  | { status: "matched"; match: MatchPair }
  | { status: "already_waiting"; user: WaitingUser }
  | { status: "already_matched"; match: StoredMatch };

export interface ClientToServerEvents {
  "matchmaking:join": (payload: MatchmakingJoinPayload) => void;
  "matchmaking:cancel": () => void;
}

export interface ServerToClientEvents {
  "matchmaking:waiting": (payload: MatchmakingWaitingPayload) => void;
  match_found: (payload: MatchFoundPayload) => void;
  "matchmaking:cancelled": (payload: MatchmakingCancelledPayload) => void;
  "matchmaking:error": (payload: MatchmakingErrorPayload) => void;
}

export function isChatMode(value: unknown): value is ChatMode {
  return (
    typeof value === "string" &&
    (CHAT_MODES as readonly string[]).includes(value)
  );
}

export function isUserGender(value: unknown): value is UserGender {
  return (
    typeof value === "string" &&
    (USER_GENDERS as readonly string[]).includes(value)
  );
}

export function isGenderPreference(value: unknown): value is GenderPreference {
  return (
    typeof value === "string" &&
    (GENDER_PREFERENCES as readonly string[]).includes(value)
  );
}

export function parseJoinPayload(
  raw: unknown,
): { mode: ChatMode; preference: GenderPreference } | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<MatchmakingJoinPayload> & {
    userId?: unknown;
  };
  if (!isChatMode(payload.mode)) {
    return null;
  }

  const preference = payload.preference ?? "any";
  if (!isGenderPreference(preference)) {
    return null;
  }

  return {
    mode: payload.mode,
    preference,
  };
}

/**
 * `any` matches anyone. `male` / `female` only match a user of that gender.
 * A specific preference cannot be satisfied when the other user's gender is unknown.
 */
export function preferenceAcceptsGender(
  preference: GenderPreference,
  otherGender: UserGender | undefined,
): boolean {
  if (preference === "any") {
    return true;
  }

  return otherGender === preference;
}

export function areUsersCompatible(a: WaitingUser, b: WaitingUser): boolean {
  if (a.socketId === b.socketId) {
    return false;
  }

  if (a.mode !== b.mode) {
    return false;
  }

  return (
    preferenceAcceptsGender(a.preference, b.gender) &&
    preferenceAcceptsGender(b.preference, a.gender)
  );
}

export function toMatchFoundPayload(
  match: StoredMatch | { matchId: string; mode: ChatMode; peerSocketId: string },
): MatchFoundPayload {
  return {
    matchId: match.matchId,
    peerSocketId: match.peerSocketId,
    mode: match.mode,
  };
}
