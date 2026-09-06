import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSupabaseEntitlementStore } from "../src/entitlements/supabase-store.js";
import type { SupabaseClient } from "@supabase/supabase-js";

type MockSupabaseClient = {
  from: ReturnType<SupabaseClient["from"]>;
};

function createMockSupabaseClient() {
  const storage = new Map<string, unknown>();

  const client: MockSupabaseClient = {
    from(table: string) {
      if (table !== "user_entitlements") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select(columns: string) {
          return {
            eq(column: string, value: string) {
              return {
                async maybeSingle() {
                  const key = `${column}:${value}`;
                  const data = storage.get(key) ?? null;
                  return { data, error: null };
                },
              };
            },
          };
        },
        insert(record: unknown) {
          return {
            select(columns: string) {
              return {
                async single() {
                  const row = record as {
                    user_id: string;
                    trial_started_at: string;
                    trial_expires_at: string;
                    own_gender?: string | null;
                  };

                  const key = `user_id:${row.user_id}`;
                  const existing = storage.get(key);

                  if (existing) {
                    return {
                      data: null,
                      error: { code: "23505", message: "duplicate key" },
                    };
                  }

                  const data = {
                    user_id: row.user_id,
                    trial_started_at: row.trial_started_at,
                    trial_expires_at: row.trial_expires_at,
                    own_gender: row.own_gender ?? null,
                  };

                  storage.set(key, data);
                  return { data, error: null };
                },
              };
            },
          };
        },
        update(updates: unknown) {
          return {
            eq(column: string, value: string) {
              return {
                select(columns: string) {
                  return {
                    async maybeSingle() {
                      const key = `${column}:${value}`;
                      const existing = storage.get(key) as
                        | {
                            user_id: string;
                            trial_started_at: string;
                            trial_expires_at: string;
                            own_gender?: string | null;
                          }
                        | undefined;

                      if (!existing) {
                        return { data: null, error: null };
                      }

                      const updated = {
                        ...existing,
                        ...(updates as Record<string, unknown>),
                      };

                      storage.set(key, updated);
                      return { data: updated, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      } as ReturnType<SupabaseClient["from"]>;
    },
  };

  return client as unknown as SupabaseClient;
}

function createFailingSupabaseClient(errorMessage = "Connection failed"): SupabaseClient {
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: null,
                    error: { message: errorMessage, code: "PGRST301" },
                  };
                },
              };
            },
          };
        },
        insert() {
          return {
            select() {
              return {
                async single() {
                  return {
                    data: null,
                    error: { message: errorMessage, code: "PGRST301" },
                  };
                },
              };
            },
          };
        },
        update() {
          return {
            eq() {
              return {
                select() {
                  return {
                    async maybeSingle() {
                      return {
                        data: null,
                        error: { message: errorMessage, code: "PGRST301" },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      } as ReturnType<SupabaseClient["from"]>;
    },
  };

  return client as unknown as SupabaseClient;
}

describe("Supabase entitlement store", () => {
  it("can read an entitlement record", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    // Insert manually
    await store.insertIfAbsent({
      userId: "user_read_test",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
    });

    const record = await store.getByUserId("user_read_test");

    assert.equal(record?.userId, "user_read_test");
    assert.equal(record?.trialStartedAt, "2026-09-06T10:00:00.000Z");
    assert.equal(record?.trialExpiresAt, "2026-09-07T10:00:00.000Z");
    assert.equal(record?.ownGender, undefined);
  });

  it("can create an entitlement record", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const created = await store.insertIfAbsent({
      userId: "user_create_test",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
    });

    assert.equal(created.userId, "user_create_test");
    assert.equal(created.trialStartedAt, "2026-09-06T10:00:00.000Z");
    assert.equal(created.trialExpiresAt, "2026-09-07T10:00:00.000Z");
  });

  it("preserves existing trial timestamps on race condition", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const first = await store.insertIfAbsent({
      userId: "user_race_test",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
    });

    const second = await store.insertIfAbsent({
      userId: "user_race_test",
      trialStartedAt: "2099-01-01T00:00:00.000Z",
      trialExpiresAt: "2099-01-02T00:00:00.000Z",
    });

    assert.equal(second.trialStartedAt, first.trialStartedAt);
    assert.equal(second.trialExpiresAt, first.trialExpiresAt);
  });

  it("can update own gender on existing record", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    await store.insertIfAbsent({
      userId: "user_gender_test",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
    });

    const updated = await store.updateOwnGender("user_gender_test", "female");

    assert.equal(updated?.userId, "user_gender_test");
    assert.equal(updated?.ownGender, "female");
    assert.equal(updated?.trialStartedAt, "2026-09-06T10:00:00.000Z");
    assert.equal(updated?.trialExpiresAt, "2026-09-07T10:00:00.000Z");
  });

  it("returns null when updating own gender on non-existent user", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const updated = await store.updateOwnGender("user_missing", "male");

    assert.equal(updated, null);
  });

  it("returns null when reading non-existent user", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const record = await store.getByUserId("user_nonexistent");

    assert.equal(record, null);
  });

  it("can store and retrieve own gender with new record", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const created = await store.insertIfAbsent({
      userId: "user_with_gender",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
      ownGender: "male",
    });

    assert.equal(created.ownGender, "male");

    const retrieved = await store.getByUserId("user_with_gender");
    assert.equal(retrieved?.ownGender, "male");
  });

  it("throws error when Supabase operations fail", async () => {
    const failingClient = createFailingSupabaseClient("Database connection lost");
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: failingClient,
    });

    await assert.rejects(
      async () => {
        await store.getByUserId("user_fail_test");
      },
      (error: Error) => {
        return error.message.includes("Database connection lost");
      },
    );
  });

  it("throws error when insert fails for non-duplicate reasons", async () => {
    const failingClient = createFailingSupabaseClient("Permission denied");
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: failingClient,
    });

    await assert.rejects(
      async () => {
        await store.insertIfAbsent({
          userId: "user_permission_test",
          trialStartedAt: "2026-09-06T10:00:00.000Z",
          trialExpiresAt: "2026-09-07T10:00:00.000Z",
        });
      },
      (error: Error) => {
        return error.message.includes("Permission denied");
      },
    );
  });

  it("normalizes timestamps to ISO format", async () => {
    const mockClient = createMockSupabaseClient();
    const store = createSupabaseEntitlementStore({
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      client: mockClient,
    });

    const created = await store.insertIfAbsent({
      userId: "user_timestamp_test",
      trialStartedAt: "2026-09-06T10:00:00.000Z",
      trialExpiresAt: "2026-09-07T10:00:00.000Z",
    });

    // Verify ISO format
    assert.equal(typeof created.trialStartedAt, "string");
    assert.equal(typeof created.trialExpiresAt, "string");
    assert.ok(created.trialStartedAt.includes("T"));
    assert.ok(created.trialStartedAt.includes("Z"));
  });
});
