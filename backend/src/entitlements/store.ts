import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOwnGender,
  type EntitlementRecord,
  type EntitlementStore,
  type OwnGender,
} from "./types.js";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const defaultFilePath = path.join(backendRoot, "data", "entitlements.json");

type EntitlementMap = Record<string, EntitlementRecord>;

function normalizeRecord(value: EntitlementRecord): EntitlementRecord {
  const ownGender = isOwnGender(value.ownGender) ? value.ownGender : undefined;

  return {
    userId: value.userId,
    trialStartedAt: value.trialStartedAt,
    trialExpiresAt: value.trialExpiresAt,
    ...(ownGender ? { ownGender } : {}),
  };
}

function isRecord(value: unknown): value is EntitlementRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<EntitlementRecord>;
  return (
    typeof record.userId === "string" &&
    typeof record.trialStartedAt === "string" &&
    typeof record.trialExpiresAt === "string"
  );
}

/**
 * JSON-file entitlement store used when Supabase credentials are not configured.
 */
export function createFileEntitlementStore(
  filePath = defaultFilePath,
): EntitlementStore {
  let queue: Promise<unknown> = Promise.resolve();

  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work, work);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function readAll(): Promise<EntitlementMap> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }

      const records: EntitlementMap = {};
      for (const [userId, value] of Object.entries(parsed)) {
        if (isRecord(value)) {
          records[userId] = normalizeRecord(value);
        }
      }
      return records;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  async function writeAll(records: EntitlementMap): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }

  return {
    getByUserId(userId) {
      return enqueue(async () => {
        const records = await readAll();
        return records[userId] ?? null;
      });
    },

    insertIfAbsent(record) {
      return enqueue(async () => {
        const records = await readAll();
        const existing = records[record.userId];
        if (existing) {
          return existing;
        }

        const stored = normalizeRecord(record);
        records[record.userId] = stored;
        await writeAll(records);
        return stored;
      });
    },

    updateOwnGender(userId: string, ownGender: OwnGender) {
      return enqueue(async () => {
        const records = await readAll();
        const existing = records[userId];
        if (!existing) {
          return null;
        }

        const updated = normalizeRecord({
          ...existing,
          ownGender,
        });
        records[userId] = updated;
        await writeAll(records);
        return updated;
      });
    },
  };
}

export const fileEntitlementStore = createFileEntitlementStore();
