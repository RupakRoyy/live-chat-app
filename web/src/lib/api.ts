"use client";

import { getToken } from "@clerk/nextjs";
import { publicEnv } from "./env";

export type AuthMeResponse = {
  userId: string;
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

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await apiRequest("/auth/me");

  if (!response.ok) {
    throw new Error("Failed to load authenticated user");
  }

  const data = (await response.json()) as AuthMeResponse;

  if (typeof data.userId !== "string" || !data.userId) {
    throw new Error("Failed to load authenticated user");
  }

  return data;
}
