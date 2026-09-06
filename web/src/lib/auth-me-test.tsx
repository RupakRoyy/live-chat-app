"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { fetchAuthMe } from "./api";

/**
 * Calls GET /auth/me after Clerk loads.
 * Anonymous users receive authenticated:false. Signed-in users establish
 * backend identity and a one-time Pro trial. Renders nothing.
 */
export function AuthMeTest() {
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    void fetchAuthMe().catch(() => {
      // Ignore transport errors; UI entitlement refresh is handled separately.
    });
  }, [isLoaded]);

  return null;
}
