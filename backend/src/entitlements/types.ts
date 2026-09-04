export type EntitlementRecord = {
  userId: string;
  trialStartedAt: string;
  trialExpiresAt: string;
};

export type ProStatus = {
  isPro: boolean;
  trialStartedAt: string;
  trialExpiresAt: string;
};

/**
 * Persistence interface for Pro entitlements.
 * Swap the file-backed store for Supabase later without changing service logic.
 */
export interface EntitlementStore {
  getByUserId(userId: string): Promise<EntitlementRecord | null>;
  /**
   * Insert the record only if this user has none.
   * Returns the existing record when one is already stored.
   */
  insertIfAbsent(record: EntitlementRecord): Promise<EntitlementRecord>;
}

/** Canonical free gender preference. Specific genders require active Pro. */
export const ANY_GENDER_PREFERENCE = "any";
