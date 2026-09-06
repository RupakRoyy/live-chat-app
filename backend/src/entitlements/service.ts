import {
  ANONYMOUS_ENTITLEMENT,
  ANY_GENDER_PREFERENCE,
  type AuthenticatedEntitlement,
  type EntitlementRecord,
  type EntitlementSnapshot,
  type EntitlementStore,
  type OwnGender,
  type ProStatus,
} from "./types.js";

const MS_PER_HOUR = 60 * 60 * 1000;

export const OWN_GENDER_REQUIRED_CODE = "own_gender_required" as const;

export type MatchmakingJoinResolution =
  | {
      ok: true;
      userId?: string;
      preference: string;
      ownGender?: OwnGender;
    }
  | {
      ok: false;
      code: typeof OWN_GENDER_REQUIRED_CODE;
      message: string;
    };

export type ProEntitlementService = {
  getProStatus(userId: string): Promise<ProStatus>;
  getEntitlementSnapshot(userId?: string | null): Promise<EntitlementSnapshot>;
  hasActiveProAccess(userId: string): Promise<boolean>;
  getOwnGender(userId: string): Promise<OwnGender | null>;
  setOwnGender(
    userId: string,
    gender: OwnGender,
  ): Promise<AuthenticatedEntitlement>;
  canSelectGenderPreference(
    userId: string | null | undefined,
    preference: string,
  ): Promise<boolean>;
  resolveGenderPreference<T extends string>(
    userId: string | null | undefined,
    preference: T,
  ): Promise<T | typeof ANY_GENDER_PREFERENCE>;
  resolveMatchmakingJoin(
    userId: string | null | undefined,
    preference: string,
  ): Promise<MatchmakingJoinResolution>;
};

export function createProEntitlementService(options: {
  store: EntitlementStore;
  getTrialDurationHours: () => number;
  now?: () => Date;
}): ProEntitlementService {
  const now = options.now ?? (() => new Date());
  const inFlight = new Map<string, Promise<EntitlementRecord>>();

  function isActive(record: EntitlementRecord, at = now()): boolean {
    return at.getTime() < Date.parse(record.trialExpiresAt);
  }

  function isAnyGender(preference: string): boolean {
    return preference.trim().toLowerCase() === ANY_GENDER_PREFERENCE;
  }

  function toAuthenticatedSnapshot(
    record: EntitlementRecord,
  ): AuthenticatedEntitlement {
    const active = isActive(record);
    return {
      authenticated: true,
      userId: record.userId,
      pro: active,
      trial: active,
      trialStartedAt: record.trialStartedAt,
      trialExpiresAt: record.trialExpiresAt,
      canUseSpecificGender: active,
      ownGender: record.ownGender ?? null,
    };
  }

  async function getOrCreateRecord(userId: string): Promise<EntitlementRecord> {
    const existing = await options.store.getByUserId(userId);
    if (existing) {
      return existing;
    }

    const pending = inFlight.get(userId);
    if (pending) {
      return pending;
    }

    const task = (async () => {
      const startedAt = now();
      const durationMs = options.getTrialDurationHours() * MS_PER_HOUR;
      const expiresAt = new Date(startedAt.getTime() + durationMs);

      return options.store.insertIfAbsent({
        userId,
        trialStartedAt: startedAt.toISOString(),
        trialExpiresAt: expiresAt.toISOString(),
      });
    })().finally(() => {
      inFlight.delete(userId);
    });

    inFlight.set(userId, task);
    return task;
  }

  async function getProStatus(userId: string): Promise<ProStatus> {
    const record = await getOrCreateRecord(userId);
    return {
      isPro: isActive(record),
      trialStartedAt: record.trialStartedAt,
      trialExpiresAt: record.trialExpiresAt,
    };
  }

  async function getEntitlementSnapshot(
    userId?: string | null,
  ): Promise<EntitlementSnapshot> {
    if (!userId) {
      return ANONYMOUS_ENTITLEMENT;
    }

    const record = await getOrCreateRecord(userId);
    return toAuthenticatedSnapshot(record);
  }

  async function hasActiveProAccess(userId: string): Promise<boolean> {
    const status = await getProStatus(userId);
    return status.isPro;
  }

  async function getOwnGender(userId: string): Promise<OwnGender | null> {
    const record = await getOrCreateRecord(userId);
    return record.ownGender ?? null;
  }

  async function setOwnGender(
    userId: string,
    gender: OwnGender,
  ): Promise<AuthenticatedEntitlement> {
    await getOrCreateRecord(userId);
    const updated = await options.store.updateOwnGender(userId, gender);
    if (!updated) {
      throw new Error("Failed to save own gender");
    }

    return toAuthenticatedSnapshot(updated);
  }

  async function canSelectGenderPreference(
    userId: string | null | undefined,
    preference: string,
  ): Promise<boolean> {
    if (isAnyGender(preference)) {
      return true;
    }

    if (!userId) {
      return false;
    }

    return hasActiveProAccess(userId);
  }

  async function resolveGenderPreference<T extends string>(
    userId: string | null | undefined,
    preference: T,
  ): Promise<T | typeof ANY_GENDER_PREFERENCE> {
    if (await canSelectGenderPreference(userId, preference)) {
      return preference;
    }

    return ANY_GENDER_PREFERENCE;
  }

  async function resolveMatchmakingJoin(
    userId: string | null | undefined,
    preference: string,
  ): Promise<MatchmakingJoinResolution> {
    const resolvedPreference = await resolveGenderPreference(userId, preference);
    const ownGender = userId ? ((await getOwnGender(userId)) ?? undefined) : undefined;

    if (!isAnyGender(resolvedPreference) && !ownGender) {
      return {
        ok: false,
        code: OWN_GENDER_REQUIRED_CODE,
        message: "Set your own gender before matching with a specific gender.",
      };
    }

    return {
      ok: true,
      ...(userId ? { userId } : {}),
      preference: resolvedPreference,
      ...(ownGender ? { ownGender } : {}),
    };
  }

  return {
    getProStatus,
    getEntitlementSnapshot,
    hasActiveProAccess,
    getOwnGender,
    setOwnGender,
    canSelectGenderPreference,
    resolveGenderPreference,
    resolveMatchmakingJoin,
  };
}
