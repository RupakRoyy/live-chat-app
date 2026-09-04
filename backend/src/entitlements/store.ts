import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EntitlementRecord, EntitlementStore } from "./types.js";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const defaultFilePath = path.join(backendRoot, "data", "entitlements.json");

type EntitlementMap = Record<string, EntitlementRecord>;

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
 * JSON-file entitlement store. Replace this module with a Supabase adapter later.
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
          records[userId] = value;
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

        records[record.userId] = record;
        await writeAll(records);
        return record;
      });
    },
  };
}

export const fileEntitlementStore = createFileEntitlementStore();
