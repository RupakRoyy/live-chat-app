import { env } from "../config/env.js";
import { createProEntitlementService } from "./service.js";
import { fileEntitlementStore } from "./store.js";
import { createSupabaseEntitlementStore } from "./supabase-store.js";
import type { EntitlementStore, OwnGender } from "./types.js";

export { createProEntitlementService } from "./service.js";
export { createFileEntitlementStore, fileEntitlementStore } from "./store.js";
export { createSupabaseEntitlementStore } from "./supabase-store.js";
export { OWN_GENDER_REQUIRED_CODE } from "./service.js";
export type { MatchmakingJoinResolution } from "./service.js";
export {
  ANONYMOUS_ENTITLEMENT,
  ANY_GENDER_PREFERENCE,
  isOwnGender,
  parseOwnGender,
} from "./types.js";
export type {
  AuthenticatedEntitlement,
  AnonymousEntitlement,
  EntitlementRecord,
  EntitlementSnapshot,
  EntitlementStore,
  OwnGender,
  ProStatus,
} from "./types.js";

function createConfiguredEntitlementStore(): EntitlementStore {
  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    console.info("Entitlements: using Supabase store");
    return createSupabaseEntitlementStore({
      url: env.supabaseUrl,
      serviceRoleKey: env.supabaseServiceRoleKey,
    });
  }

  console.info(
    "Entitlements: using local file store (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set)",
  );
  return fileEntitlementStore;
}

export const entitlementStore = createConfiguredEntitlementStore();

export const proEntitlementService = createProEntitlementService({
  store: entitlementStore,
  getTrialDurationHours: () => env.proTrialDurationHours,
});

export function getProStatus(userId: string) {
  return proEntitlementService.getProStatus(userId);
}

export function getEntitlementSnapshot(userId?: string | null) {
  return proEntitlementService.getEntitlementSnapshot(userId);
}

export function hasActiveProAccess(userId: string) {
  return proEntitlementService.hasActiveProAccess(userId);
}

export function canSelectGenderPreference(
  userId: string | null | undefined,
  preference: string,
) {
  return proEntitlementService.canSelectGenderPreference(userId, preference);
}

export function resolveGenderPreference<T extends string>(
  userId: string | null | undefined,
  preference: T,
) {
  return proEntitlementService.resolveGenderPreference(userId, preference);
}

export function getOwnGender(userId: string) {
  return proEntitlementService.getOwnGender(userId);
}

export function setOwnGender(userId: string, gender: OwnGender) {
  return proEntitlementService.setOwnGender(userId, gender);
}

export function resolveMatchmakingJoin(
  userId: string | null | undefined,
  preference: string,
) {
  return proEntitlementService.resolveMatchmakingJoin(userId, preference);
}
