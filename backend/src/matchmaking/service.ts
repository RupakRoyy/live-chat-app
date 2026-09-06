import { randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";
import { redis } from "../config/redis.js";
import {
  areUsersCompatible,
  isChatMode,
  isGenderPreference,
  isUserGender,
  type ChatMode,
  type JoinQueueResult,
  type MatchPair,
  type StoredMatch,
  type WaitingUser,
} from "./types.js";

const LOCK_TTL_SECONDS = 5;
const LOCK_RETRY_ATTEMPTS = 20;
const LOCK_RETRY_DELAY_MS = 50;
const MATCH_TTL_SECONDS = 60 * 60;

const localLocks = new Map<string, Promise<unknown>>();

function queueKey(mode: ChatMode): string {
  return `mm:queue:${mode}`;
}

function waitingKey(socketId: string): string {
  return `mm:waiting:${socketId}`;
}

function matchKey(socketId: string): string {
  return `mm:match:${socketId}`;
}

function lockKey(mode: ChatMode): string {
  return `mm:lock:${mode}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withLocalLock<T>(mode: ChatMode, work: () => Promise<T>): Promise<T> {
  const previous = localLocks.get(mode) ?? Promise.resolve();
  const current = previous.then(work, work);
  localLocks.set(
    mode,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );
  return current;
}

function isWaitingUser(value: unknown): value is WaitingUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<WaitingUser>;
  if (
    typeof user.socketId !== "string" ||
    !isChatMode(user.mode) ||
    !isGenderPreference(user.preference) ||
    typeof user.joinedAt !== "number"
  ) {
    return false;
  }

  if (user.gender !== undefined && !isUserGender(user.gender)) {
    return false;
  }

  if (user.userId !== undefined && typeof user.userId !== "string") {
    return false;
  }

  return true;
}

function isStoredMatch(value: unknown): value is StoredMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const match = value as Partial<StoredMatch>;
  return (
    typeof match.matchId === "string" &&
    typeof match.mode === "string" &&
    typeof match.peerSocketId === "string"
  );
}

export type JoinQueueOptions = {
  isAlive?: (socketId: string) => boolean;
};

export type MatchmakingService = {
  joinQueue(
    user: Omit<WaitingUser, "joinedAt"> & { joinedAt?: number },
    options?: JoinQueueOptions,
  ): Promise<JoinQueueResult>;
  leaveQueue(socketId: string): Promise<WaitingUser | null>;
  getWaiting(socketId: string): Promise<WaitingUser | null>;
  getMatch(socketId: string): Promise<StoredMatch | null>;
  handleDisconnect(socketId: string): Promise<void>;
};

export function createMatchmakingService(client: Redis): MatchmakingService {
  async function getWaiting(socketId: string): Promise<WaitingUser | null> {
    const value = await client.get<WaitingUser>(waitingKey(socketId));
    return isWaitingUser(value) ? value : null;
  }

  async function getMatch(socketId: string): Promise<StoredMatch | null> {
    const value = await client.get<StoredMatch>(matchKey(socketId));
    return isStoredMatch(value) ? value : null;
  }

  async function acquireRedisLock(mode: ChatMode): Promise<string | null> {
    const token = randomUUID();

    for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS; attempt += 1) {
      const acquired = await client.set(lockKey(mode), token, {
        nx: true,
        ex: LOCK_TTL_SECONDS,
      });

      if (acquired === "OK") {
        return token;
      }

      await sleep(LOCK_RETRY_DELAY_MS);
    }

    return null;
  }

  async function releaseRedisLock(
    mode: ChatMode,
    token: string,
  ): Promise<void> {
    const current = await client.get<string>(lockKey(mode));
    if (current === token) {
      await client.del(lockKey(mode));
    }
  }

  async function withQueueLock<T>(
    mode: ChatMode,
    work: () => Promise<T>,
  ): Promise<T> {
    return withLocalLock(mode, async () => {
      const token = await acquireRedisLock(mode);
      try {
        return await work();
      } finally {
        if (token) {
          await releaseRedisLock(mode, token);
        }
      }
    });
  }

  async function listQueuedSocketIds(mode: ChatMode): Promise<string[]> {
    const members = await client.zrange<string[]>(queueKey(mode), 0, -1);
    if (!Array.isArray(members)) {
      return [];
    }

    return members.filter((member): member is string => typeof member === "string");
  }

  async function enqueue(user: WaitingUser): Promise<void> {
    await client.set(waitingKey(user.socketId), user);
    await client.zadd(queueKey(user.mode), {
      score: user.joinedAt,
      member: user.socketId,
    });
  }

  async function removeFromQueue(
    socketId: string,
    mode?: ChatMode,
  ): Promise<WaitingUser | null> {
    const user = await getWaiting(socketId);
    const queueMode = mode ?? user?.mode;

    if (queueMode) {
      await client.zrem(queueKey(queueMode), socketId);
    }

    await client.del(waitingKey(socketId));
    return user;
  }

  async function saveMatch(pair: MatchPair): Promise<void> {
    const [a, b] = pair.users;
    const recordA: StoredMatch = {
      matchId: pair.matchId,
      mode: pair.mode,
      peerSocketId: b.socketId,
    };
    const recordB: StoredMatch = {
      matchId: pair.matchId,
      mode: pair.mode,
      peerSocketId: a.socketId,
    };

    await client.set(matchKey(a.socketId), recordA, { ex: MATCH_TTL_SECONDS });
    await client.set(matchKey(b.socketId), recordB, { ex: MATCH_TTL_SECONDS });
  }

  async function clearMatch(socketId: string): Promise<StoredMatch | null> {
    const match = await getMatch(socketId);
    if (!match) {
      await client.del(matchKey(socketId));
      return null;
    }

    await client.del(matchKey(socketId), matchKey(match.peerSocketId));
    return match;
  }

  async function findCompatible(
    user: WaitingUser,
    isAlive?: (socketId: string) => boolean,
  ): Promise<WaitingUser | null> {
    const candidateIds = await listQueuedSocketIds(user.mode);

    for (const candidateId of candidateIds) {
      if (candidateId === user.socketId) {
        continue;
      }

      if (isAlive && !isAlive(candidateId)) {
        await removeFromQueue(candidateId, user.mode);
        continue;
      }

      const candidate = await getWaiting(candidateId);
      if (!candidate) {
        await client.zrem(queueKey(user.mode), candidateId);
        continue;
      }

      if (areUsersCompatible(user, candidate)) {
        return candidate;
      }
    }

    return null;
  }

  async function joinQueue(
    input: Omit<WaitingUser, "joinedAt"> & { joinedAt?: number },
    options?: JoinQueueOptions,
  ): Promise<JoinQueueResult> {
    const user: WaitingUser = {
      socketId: input.socketId,
      mode: input.mode,
      preference: input.preference,
      gender: input.gender,
      userId: input.userId,
      joinedAt: input.joinedAt ?? Date.now(),
    };

    return withQueueLock(user.mode, async () => {
      const existingWait = await getWaiting(user.socketId);
      if (existingWait) {
        return { status: "already_waiting", user: existingWait };
      }

      const existingMatch = await getMatch(user.socketId);
      if (existingMatch) {
        return { status: "already_matched", match: existingMatch };
      }

      const partner = await findCompatible(user, options?.isAlive);
      if (!partner) {
        await enqueue(user);
        return { status: "waiting", user };
      }

      await removeFromQueue(partner.socketId, partner.mode);

      const match: MatchPair = {
        matchId: randomUUID(),
        mode: user.mode,
        users: [user, partner],
      };

      await saveMatch(match);
      return { status: "matched", match };
    });
  }

  async function leaveQueue(socketId: string): Promise<WaitingUser | null> {
    const waiting = await getWaiting(socketId);
    if (!waiting) {
      return null;
    }

    return withQueueLock(waiting.mode, () =>
      removeFromQueue(socketId, waiting.mode),
    );
  }

  async function handleDisconnect(socketId: string): Promise<void> {
    const waiting = await getWaiting(socketId);
    if (waiting) {
      await withQueueLock(waiting.mode, () =>
        removeFromQueue(socketId, waiting.mode),
      );
    }

    await clearMatch(socketId);
  }

  return {
    joinQueue,
    leaveQueue,
    getWaiting,
    getMatch,
    handleDisconnect,
  };
}

export const matchmakingService = createMatchmakingService(redis);
