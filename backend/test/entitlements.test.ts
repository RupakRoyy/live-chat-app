import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createProEntitlementService } from "../src/entitlements/service.js";
import { createFileEntitlementStore } from "../src/entitlements/store.js";
import {
  parseOwnGender,
  type EntitlementRecord,
  type EntitlementStore,
  type OwnGender,
} from "../src/entitlements/types.js";

function createMemoryStore(
  seed: Record<string, EntitlementRecord> = {},
): EntitlementStore {
  const records = new Map<string, EntitlementRecord>(Object.entries(seed));

  return {
    async getByUserId(userId) {
      return records.get(userId) ?? null;
    },
    async insertIfAbsent(record) {
      const existing = records.get(record.userId);
      if (existing) {
        return existing;
      }
      records.set(record.userId, record);
      return record;
    },
    async updateOwnGender(userId, ownGender: OwnGender) {
      const existing = records.get(userId);
      if (!existing) {
        return null;
      }

      const updated = { ...existing, ownGender };
      records.set(userId, updated);
      return updated;
    },
  };
}

describe("Pro trial entitlements", () => {
  it("returns an anonymous snapshot without creating a trial", async () => {
    const store = createMemoryStore();
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    const snapshot = await service.getEntitlementSnapshot();

    assert.deepEqual(snapshot, {
      authenticated: false,
      pro: false,
      trial: false,
      canUseSpecificGender: false,
    });
    assert.equal(await store.getByUserId("missing"), null);
    assert.equal(await service.resolveGenderPreference(undefined, "any"), "any");
    assert.equal(await service.resolveGenderPreference(undefined, "female"), "any");
    assert.equal(await service.resolveGenderPreference(null, "male"), "any");
  });

  it("creates a 24-hour trial once on first authenticated access", async () => {
    const store = createMemoryStore();
    const now = new Date("2026-09-06T10:00:00.000Z");
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => now,
    });

    const first = await service.getEntitlementSnapshot("user_clerk_1");
    const second = await service.getEntitlementSnapshot("user_clerk_1");
    const stored = await store.getByUserId("user_clerk_1");

    assert.equal(first.authenticated, true);
    assert.equal(first.pro, true);
    assert.equal(first.trial, true);
    assert.equal(first.canUseSpecificGender, true);
    assert.equal(first.authenticated ? first.ownGender : "missing", null);
    assert.equal(first.trialStartedAt, "2026-09-06T10:00:00.000Z");
    assert.equal(first.trialExpiresAt, "2026-09-07T10:00:00.000Z");
    assert.deepEqual(first, second);
    assert.equal(stored?.trialStartedAt, first.trialStartedAt);
    assert.equal(stored?.trialExpiresAt, first.trialExpiresAt);
  });

  it("does not reset the trial after later reads, matches, or a second create attempt", async () => {
    const store = createMemoryStore();
    let current = new Date("2026-09-06T10:00:00.000Z");
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => current,
    });

    const original = await service.getProStatus("user_clerk_1");
    current = new Date("2026-09-06T18:00:00.000Z");

    await service.resolveGenderPreference("user_clerk_1", "female");
    await service.resolveGenderPreference("user_clerk_1", "male");
    const again = await service.getProStatus("user_clerk_1");
    const raced = await store.insertIfAbsent({
      userId: "user_clerk_1",
      trialStartedAt: "2099-01-01T00:00:00.000Z",
      trialExpiresAt: "2099-01-02T00:00:00.000Z",
    });

    assert.equal(again.trialStartedAt, original.trialStartedAt);
    assert.equal(again.trialExpiresAt, original.trialExpiresAt);
    assert.equal(raced.trialStartedAt, original.trialStartedAt);
    assert.equal(raced.trialExpiresAt, original.trialExpiresAt);
  });

  it("allows specific gender only while the trial is active", async () => {
    const store = createMemoryStore();
    let current = new Date("2026-09-06T10:00:00.000Z");
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => current,
    });

    assert.equal(await service.resolveGenderPreference("user_clerk_1", "female"), "female");
    assert.equal(await service.canSelectGenderPreference("user_clerk_1", "male"), true);
    assert.equal(await service.canSelectGenderPreference("user_clerk_1", "any"), true);

    current = new Date("2026-09-07T10:00:00.000Z");

    const expired = await service.getEntitlementSnapshot("user_clerk_1");
    assert.equal(expired.authenticated, true);
    assert.equal(expired.pro, false);
    assert.equal(expired.trial, false);
    assert.equal(expired.canUseSpecificGender, false);
    assert.equal(expired.authenticated ? expired.ownGender : "missing", null);
    assert.equal(expired.trialExpiresAt, "2026-09-07T10:00:00.000Z");
    assert.equal(await service.resolveGenderPreference("user_clerk_1", "female"), "any");
    assert.equal(await service.resolveGenderPreference("user_clerk_1", "any"), "any");
  });

  it("ignores a fake frontend Pro flag by requiring a verified user id", async () => {
    const store = createMemoryStore({
      user_expired: {
        userId: "user_expired",
        trialStartedAt: "2026-09-01T00:00:00.000Z",
        trialExpiresAt: "2026-09-02T00:00:00.000Z",
      },
    });
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    assert.equal(await service.resolveGenderPreference(undefined, "female"), "any");
    assert.equal(await service.resolveGenderPreference("user_expired", "male"), "any");
    assert.equal(await service.canSelectGenderPreference("user_expired", "female"), false);
  });

  it("keeps file-store insertIfAbsent from creating a second trial", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "entitlements-"));
    const filePath = path.join(dir, "entitlements.json");
    const store = createFileEntitlementStore(filePath);

    try {
      const first = await store.insertIfAbsent({
        userId: "user_file",
        trialStartedAt: "2026-09-06T00:00:00.000Z",
        trialExpiresAt: "2026-09-07T00:00:00.000Z",
      });
      const second = await store.insertIfAbsent({
        userId: "user_file",
        trialStartedAt: "2099-01-01T00:00:00.000Z",
        trialExpiresAt: "2099-01-02T00:00:00.000Z",
      });

      assert.deepEqual(first, second);
      assert.equal(second.trialStartedAt, "2026-09-06T00:00:00.000Z");

      const updated = await store.updateOwnGender("user_file", "female");
      const stored = await store.getByUserId("user_file");
      assert.equal(updated?.ownGender, "female");
      assert.equal(stored?.ownGender, "female");
      assert.equal(stored?.trialStartedAt, first.trialStartedAt);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("saves own gender on the existing user record without resetting the trial", async () => {
    const store = createMemoryStore();
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T10:00:00.000Z"),
    });

    await service.getEntitlementSnapshot("user_clerk_1");
    const saved = await service.setOwnGender("user_clerk_1", "male");
    const again = await service.getEntitlementSnapshot("user_clerk_1");

    assert.equal(saved.ownGender, "male");
    assert.equal(again.authenticated ? again.ownGender : "missing", "male");
    assert.equal(saved.trialStartedAt, "2026-09-06T10:00:00.000Z");
    assert.equal(saved.trialExpiresAt, "2026-09-07T10:00:00.000Z");
    assert.equal(await service.getOwnGender("user_clerk_1"), "male");
  });

  it("rejects invalid own-gender values and ignores a client-supplied userId", () => {
    assert.equal(parseOwnGender("male"), "male");
    assert.equal(parseOwnGender("female"), "female");
    assert.equal(parseOwnGender("any"), null);
    assert.equal(parseOwnGender("other"), null);
    assert.equal(parseOwnGender(""), null);
    assert.equal(parseOwnGender({ gender: "male", userId: "user_other" }), null);
  });

  it("allows Any Gender without own gender and blocks specific preference until it is set", async () => {
    const store = createMemoryStore();
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T10:00:00.000Z"),
    });

    const anyWithoutGender = await service.resolveMatchmakingJoin(
      "user_clerk_1",
      "any",
    );
    const specificWithoutGender = await service.resolveMatchmakingJoin(
      "user_clerk_1",
      "female",
    );

    assert.deepEqual(anyWithoutGender, {
      ok: true,
      userId: "user_clerk_1",
      preference: "any",
    });
    assert.deepEqual(specificWithoutGender, {
      ok: false,
      code: "own_gender_required",
      message: "Set your own gender before matching with a specific gender.",
    });

    await service.setOwnGender("user_clerk_1", "female");
    const specificWithGender = await service.resolveMatchmakingJoin(
      "user_clerk_1",
      "male",
    );
    assert.deepEqual(specificWithGender, {
      ok: true,
      userId: "user_clerk_1",
      preference: "male",
      ownGender: "female",
    });
  });

  it("downgrades anonymous and expired specific preferences without inventing own gender", async () => {
    const store = createMemoryStore({
      user_expired: {
        userId: "user_expired",
        trialStartedAt: "2026-09-01T00:00:00.000Z",
        trialExpiresAt: "2026-09-02T00:00:00.000Z",
        ownGender: "male",
      },
    });
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    assert.deepEqual(await service.resolveMatchmakingJoin(undefined, "male"), {
      ok: true,
      preference: "any",
    });
    assert.deepEqual(await service.resolveMatchmakingJoin(null, "female"), {
      ok: true,
      preference: "any",
    });
    assert.deepEqual(await service.resolveMatchmakingJoin("user_expired", "female"), {
      ok: true,
      userId: "user_expired",
      preference: "any",
      ownGender: "male",
    });
  });

  it("loads own gender from the store, never from a client-supplied value", async () => {
    const store = createMemoryStore();
    const service = createProEntitlementService({
      store,
      getTrialDurationHours: () => 24,
      now: () => new Date("2026-09-06T10:00:00.000Z"),
    });

    await service.setOwnGender("user_real", "male");
    const resolved = await service.resolveMatchmakingJoin("user_real", "any");

    assert.equal(resolved.ok, true);
    if (resolved.ok) {
      assert.equal(resolved.ownGender, "male");
      assert.equal(resolved.userId, "user_real");
    }
  });
});
