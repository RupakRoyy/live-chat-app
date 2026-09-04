import { env } from "../config/env.js";
import { createProEntitlementService } from "./service.js";
import { fileEntitlementStore } from "./store.js";

export { createProEntitlementService } from "./service.js";
export { createFileEntitlementStore, fileEntitlementStore } from "./store.js";
export { ANY_GENDER_PREFERENCE } from "./types.js";
export type {
  EntitlementRecord,
  EntitlementStore,
  ProStatus,
} from "./types.js";

export const proEntitlementService = createProEntitlementService({
  store: fileEntitlementStore,
  getTrialDurationHours: () => env.proTrialDurationHours,
});

export function getProStatus(userId: string) {
  return proEntitlementService.getProStatus(userId);
}

export function hasActiveProAccess(userId: string) {
  return proEntitlementService.hasActiveProAccess(userId);
}

export function canSelectGenderPreference(userId: string, preference: string) {
  return proEntitlementService.canSelectGenderPreference(userId, preference);
}
