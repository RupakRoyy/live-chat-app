import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMatchmakingService } from "../src/matchmaking/service.js";
import {
  areUsersCompatible,
  parseJoinPayload,
  type ChatMode,
  type GenderPreference,
  type UserGender,
  type WaitingUser,
} from "../src/matchmaking/types.js";

function waiting(input: {
  socketId: string;
  mode?: ChatMode;
  preference?: GenderPreference;
  gender?: UserGender;
  userId?: string;
}): WaitingUser {
  return {
    socketId: input.socketId,
    mode: input.mode ?? "text",
    preference: input.preference ?? "any",
    gender: input.gender,
    userId: input.userId,
    joinedAt: 1,
  };
}

type ZMember = { score: number; member: string };

function createMemoryRedis() {
  const kv = new Map<string, unknown>();
  const zsets = new Map<string, ZMember[]>();

  return {
    async get<T>(key: string): Promise<T | null> {
      return (kv.get(key) as T | undefined) ?? null;
    },
    async set(
      key: string,
      value: unknown,
      options?: { nx?: boolean; ex?: number },
    ) {
      if (options?.nx && kv.has(key)) {
        return null;
      }
      kv.set(key, value);
      return "OK";
    },
    async del(...keys: string[]) {
      for (const key of keys) {
        kv.delete(key);
      }
      return keys.length;
    },
    async zrange<T>(key: string): Promise<T> {
      const members = (zsets.get(key) ?? [])
        .slice()
        .sort((a, b) => a.score - b.score)
        .map((entry) => entry.member);
      return members as T;
    },
    async zadd(key: string, entry: ZMember) {
      const current = zsets.get(key) ?? [];
      const next = current.filter((item) => item.member !== entry.member);
      next.push(entry);
      zsets.set(key, next);
      return 1;
    },
    async zrem(key: string, member: string) {
      const current = zsets.get(key) ?? [];
      zsets.set(
        key,
        current.filter((item) => item.member !== member),
      );
      return 1;
    },
  };
}

describe("gender compatibility", () => {
  it("1. male + any is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "any" }),
        waiting({ socketId: "b", preference: "any" }),
      ),
      true,
    );
  });

  it("2. female + any is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "female", preference: "any" }),
        waiting({ socketId: "b", preference: "any" }),
      ),
      true,
    );
  });

  it("3. male + male with any/any is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "any" }),
        waiting({ socketId: "b", gender: "male", preference: "any" }),
      ),
      true,
    );
  });

  it("4. female + female with any/any is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "female", preference: "any" }),
        waiting({ socketId: "b", gender: "female", preference: "any" }),
      ),
      true,
    );
  });

  it("5. male user preferring female + female user (any) is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "female" }),
        waiting({ socketId: "b", gender: "female", preference: "any" }),
      ),
      true,
    );
  });

  it("6. female user preferring male + male user (any) is compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "female", preference: "male" }),
        waiting({ socketId: "b", gender: "male", preference: "any" }),
      ),
      true,
    );
  });

  it("7. female preference + male user is incompatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "female" }),
        waiting({ socketId: "b", gender: "male", preference: "any" }),
      ),
      false,
    );
  });

  it("8. male preference + female user is incompatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "female", preference: "male" }),
        waiting({ socketId: "b", gender: "female", preference: "any" }),
      ),
      false,
    );
  });

  it("9. both specific preferences pointing at each other are compatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "female" }),
        waiting({ socketId: "b", gender: "female", preference: "male" }),
      ),
      true,
    );
  });

  it("10. conflicting specific preferences are incompatible", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "female" }),
        waiting({ socketId: "b", gender: "female", preference: "female" }),
      ),
      false,
    );
  });

  it("19. backend determines compatibility on both sides", () => {
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "any" }),
        waiting({ socketId: "b", gender: "female", preference: "male" }),
      ),
      true,
    );
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "any" }),
        waiting({ socketId: "b", gender: "female", preference: "female" }),
      ),
      false,
    );
    assert.equal(
      areUsersCompatible(
        waiting({ socketId: "a", gender: "male", preference: "any" }),
        waiting({ socketId: "b", gender: "female", preference: "any" }),
      ),
      true,
    );
  });
});

describe("join payload security", () => {
  it("16-17. ignores client-supplied own gender and userId", () => {
    const parsed = parseJoinPayload({
      mode: "video",
      preference: "female",
      gender: "male",
      userId: "user_attacker",
    });

    assert.deepEqual(parsed, {
      mode: "video",
      preference: "female",
    });
    assert.equal(parsed && "gender" in parsed, false);
    assert.equal(parsed && "userId" in parsed, false);
  });

  it("still accepts Any Gender when the client sends junk gender fields", () => {
    const parsed = parseJoinPayload({
      mode: "text",
      preference: "any",
      gender: "other",
      userId: "user_other",
    });

    assert.deepEqual(parsed, {
      mode: "text",
      preference: "any",
    });
  });
});

describe("matchmaking lifecycle", () => {
  it("20. disconnect removes queue and gender data", async () => {
    const service = createMatchmakingService(
      createMemoryRedis() as never,
    );

    const waitingResult = await service.joinQueue({
      socketId: "sock-a",
      mode: "text",
      preference: "any",
      gender: "male",
      userId: "user_a",
    });
    assert.equal(waitingResult.status, "waiting");
    assert.equal((await service.getWaiting("sock-a"))?.gender, "male");

    await service.handleDisconnect("sock-a");
    assert.equal(await service.getWaiting("sock-a"), null);
    assert.equal(await service.getMatch("sock-a"), null);
  });

  it("21. ghost waiter protection still removes dead sockets", async () => {
    const service = createMatchmakingService(
      createMemoryRedis() as never,
    );

    await service.joinQueue({
      socketId: "ghost",
      mode: "voice",
      preference: "any",
      gender: "female",
    });

    const result = await service.joinQueue(
      {
        socketId: "alive",
        mode: "voice",
        preference: "any",
        gender: "male",
      },
      {
        isAlive: (socketId) => socketId !== "ghost",
      },
    );

    assert.equal(result.status, "waiting");
    assert.equal(await service.getWaiting("ghost"), null);
    assert.equal((await service.getWaiting("alive"))?.socketId, "alive");
  });

  it("22. End/Next can leave and rejoin after a match", async () => {
    const service = createMatchmakingService(
      createMemoryRedis() as never,
    );

    await service.joinQueue({
      socketId: "sock-a",
      mode: "video",
      preference: "female",
      gender: "male",
      userId: "user_a",
    });
    const matched = await service.joinQueue({
      socketId: "sock-b",
      mode: "video",
      preference: "male",
      gender: "female",
      userId: "user_b",
    });

    assert.equal(matched.status, "matched");

    await service.handleDisconnect("sock-a");
    await service.handleDisconnect("sock-b");

    assert.equal(await service.getMatch("sock-a"), null);
    assert.equal(await service.getMatch("sock-b"), null);

    const next = await service.joinQueue({
      socketId: "sock-a",
      mode: "video",
      preference: "any",
      gender: "male",
      userId: "user_a",
    });
    assert.equal(next.status, "waiting");
  });

  it("23. existing modes stay isolated", async () => {
    const service = createMatchmakingService(
      createMemoryRedis() as never,
    );

    await service.joinQueue({
      socketId: "text-a",
      mode: "text",
      preference: "any",
    });
    await service.joinQueue({
      socketId: "voice-a",
      mode: "voice",
      preference: "any",
    });
    const video = await service.joinQueue({
      socketId: "video-a",
      mode: "video",
      preference: "any",
    });
    const textB = await service.joinQueue({
      socketId: "text-b",
      mode: "text",
      preference: "any",
    });

    assert.equal(video.status, "waiting");
    assert.equal(textB.status, "matched");
    assert.equal(await service.getWaiting("voice-a") !== null, true);
    assert.equal(await service.getWaiting("video-a") !== null, true);
  });

  it("does not match incompatible specific-gender users in the same mode", async () => {
    const service = createMatchmakingService(
      createMemoryRedis() as never,
    );

    await service.joinQueue({
      socketId: "sock-a",
      mode: "text",
      preference: "female",
      gender: "male",
    });
    const result = await service.joinQueue({
      socketId: "sock-b",
      mode: "text",
      preference: "any",
      gender: "male",
    });

    assert.equal(result.status, "waiting");
    assert.equal(await service.getWaiting("sock-a") !== null, true);
    assert.equal(await service.getWaiting("sock-b") !== null, true);
  });
});
