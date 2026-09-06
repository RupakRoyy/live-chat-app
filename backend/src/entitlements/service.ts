import {
  ANONYMOUS_ENTITLEMENT,
  ANY_GENDER_PREFERENCE,
  type EntitlementRecord,
  type EntitlementSnapshot,
  type EntitlementStore,
  type ProStatus,
} from "./types.js";

const MS_PER_HOUR = 60 * 60 * 1000;

export type ProEntitlementService = {
  getProStatus(userId: string): Promise<ProStatus>;
  getEntitlementSnapshot(userId?: string | null): Promise<EntitlementSnapshot>;
  hasActiveProAccess(userId: string): Promise<boolean>;
  canSelectGenderPreference(
    userId: string | null | undefined,
    preference: string,
  ): Promise<boolean>;
  resolveGenderPreference<T extends string>(
    userId: string | null | undefined,
    preference: T,
  ): Promise<T | typeof ANY_GENDER_PREFERENCE>;
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

    const status = await getProStatus(userId);
    return {
      authenticated: true,
      userId,
      pro: status.isPro,
      trial: status.isPro,
      trialStartedAt: status.trialStartedAt,
      trialExpiresAt: status.trialExpiresAt,
      canUseSpecificGender: status.isPro,
    };
  }

  async function hasActiveProAccess(userId: string): Promise<boolean> {
    const status = await getProStatus(userId);
    return status.isPro;
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

  return {
    getProStatus,
    getEntitlementSnapshot,
    hasActiveProAccess,
    canSelectGenderPreference,
    resolveGenderPreference,
  };
}
