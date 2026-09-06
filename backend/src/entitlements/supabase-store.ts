import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EntitlementRecord, EntitlementStore } from "./types.js";

type EntitlementRow = {
  user_id: string;
  trial_started_at: string;
  trial_expires_at: string;
};

function isRow(value: unknown): value is EntitlementRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<EntitlementRow>;
  return (
    typeof row.user_id === "string" &&
    typeof row.trial_started_at === "string" &&
    typeof row.trial_expires_at === "string"
  );
}

function toRecord(row: EntitlementRow): EntitlementRecord {
  return {
    userId: row.user_id,
    trialStartedAt: new Date(row.trial_started_at).toISOString(),
    trialExpiresAt: new Date(row.trial_expires_at).toISOString(),
  };
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/**
 * Supabase/PostgreSQL entitlement store.
 * Used only when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.
 */
export function createSupabaseEntitlementStore(options: {
  url: string;
  serviceRoleKey: string;
  client?: SupabaseClient;
}): EntitlementStore {
  const client =
    options.client ??
    createClient(options.url, options.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

  async function getByUserId(userId: string): Promise<EntitlementRecord | null> {
    const { data, error } = await client
      .from("user_entitlements")
      .select("user_id, trial_started_at, trial_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return isRow(data) ? toRecord(data) : null;
  }

  return {
    getByUserId,

    async insertIfAbsent(record) {
      const existing = await getByUserId(record.userId);
      if (existing) {
        return existing;
      }

      const { data, error } = await client
        .from("user_entitlements")
        .insert({
          user_id: record.userId,
          trial_started_at: record.trialStartedAt,
          trial_expires_at: record.trialExpiresAt,
        })
        .select("user_id, trial_started_at, trial_expires_at")
        .single();

      if (isUniqueViolation(error)) {
        const raced = await getByUserId(record.userId);
        if (raced) {
          return raced;
        }
      }

      if (error) {
        throw error;
      }

      if (!isRow(data)) {
        throw new Error("Supabase entitlement insert returned an invalid row");
      }

      return toRecord(data);
    },
  };
}
