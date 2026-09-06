export const OWN_GENDERS = ["male", "female"] as const;
export type OwnGender = (typeof OWN_GENDERS)[number];

export type EntitlementRecord = {
  userId: string;
  trialStartedAt: string;
  trialExpiresAt: string;
  ownGender?: OwnGender;
};

export type ProStatus = {
  isPro: boolean;
  trialStartedAt: string;
  trialExpiresAt: string;
};

export type AnonymousEntitlement = {
  authenticated: false;
  pro: false;
  trial: false;
  canUseSpecificGender: false;
};

export type AuthenticatedEntitlement = {
  authenticated: true;
  userId: string;
  pro: boolean;
  trial: boolean;
  trialStartedAt: string;
  trialExpiresAt: string;
  canUseSpecificGender: boolean;
  ownGender: OwnGender | null;
};

export type EntitlementSnapshot = AnonymousEntitlement | AuthenticatedEntitlement;

/**
 * Persistence interface for Pro entitlements.
 * File store is the local default. Supabase is used when credentials are configured.
 */
export interface EntitlementStore {
  getByUserId(userId: string): Promise<EntitlementRecord | null>;
  /**
   * Insert the record only if this user has none.
   * Returns the existing record when one is already stored.
   */
  insertIfAbsent(record: EntitlementRecord): Promise<EntitlementRecord>;
  /**
   * Persist own gender for an existing user record.
   * Returns null when the user has no entitlement row yet.
   */
  updateOwnGender(
    userId: string,
    ownGender: OwnGender,
  ): Promise<EntitlementRecord | null>;
}

export function isOwnGender(value: unknown): value is OwnGender {
  return (
    typeof value === "string" &&
    (OWN_GENDERS as readonly string[]).includes(value)
  );
}

export function parseOwnGender(value: unknown): OwnGender | null {
  return isOwnGender(value) ? value : null;
}

/** Canonical free gender preference. Specific genders require active Pro. */
export const ANY_GENDER_PREFERENCE = "any";

export const ANONYMOUS_ENTITLEMENT: AnonymousEntitlement = {
  authenticated: false,
  pro: false,
  trial: false,
  canUseSpecificGender: false,
};
