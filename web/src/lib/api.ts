"use client";

import { getToken } from "@clerk/nextjs";
import { publicEnv } from "./env";

export type OwnGender = "male" | "female";

export type AuthMeResponse = {
  authenticated: boolean;
  userId?: string;
  pro: boolean;
  trial: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  canUseSpecificGender: boolean;
  ownGender?: OwnGender | null;
};

export const ANONYMOUS_AUTH_ME: AuthMeResponse = {
  authenticated: false,
  pro: false,
  trial: false,
  canUseSpecificGender: false,
};

export type ProStatusResponse = {
  isPro: boolean;
  trialStartedAt: string;
  trialExpiresAt: string;
};

function backendUrl(path: string): string {
  const base = publicEnv.apiUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Authenticated fetch against the Express backend.
 * Attaches the current Clerk session token when one is available.
 */
export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(backendUrl(path), {
    ...init,
    headers,
  });
}

export function parseAuthMe(data: unknown): AuthMeResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Failed to load account");
  }

  const payload = data as Partial<AuthMeResponse>;

  if (payload.authenticated === true) {
    if (typeof payload.userId !== "string" || !payload.userId) {
      throw new Error("Failed to load authenticated user");
    }

    return {
      authenticated: true,
      userId: payload.userId,
      pro: payload.pro === true,
      trial: payload.trial === true,
      trialStartedAt:
        typeof payload.trialStartedAt === "string" ? payload.trialStartedAt : "",
      trialExpiresAt:
        typeof payload.trialExpiresAt === "string" ? payload.trialExpiresAt : "",
      canUseSpecificGender: payload.canUseSpecificGender === true,
      ownGender:
        payload.ownGender === "male" || payload.ownGender === "female"
          ? payload.ownGender
          : null,
    };
  }

  return ANONYMOUS_AUTH_ME;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await apiRequest("/auth/me");

  if (!response.ok) {
    throw new Error("Failed to load account");
  }

  return parseAuthMe(await response.json());
}

export async function updateOwnGender(
  gender: OwnGender,
): Promise<AuthMeResponse> {
  const response = await apiRequest("/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gender }),
  });

  if (!response.ok) {
    throw new Error("Failed to save gender");
  }

  return parseAuthMe(await response.json());
}

export async function fetchProStatus(): Promise<ProStatusResponse> {
  const response = await apiRequest("/pro/status");

  if (!response.ok) {
    throw new Error("Failed to load Pro status");
  }

  const data = (await response.json()) as Partial<ProStatusResponse>;

  if (typeof data.isPro !== "boolean") {
    throw new Error("Failed to load Pro status");
  }

  return {
    isPro: data.isPro,
    trialStartedAt:
      typeof data.trialStartedAt === "string" ? data.trialStartedAt : "",
    trialExpiresAt:
      typeof data.trialExpiresAt === "string" ? data.trialExpiresAt : "",
  };
}
