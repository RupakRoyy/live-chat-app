"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { fetchAuthMe } from "./api";

/**
 * Calls GET /auth/me with the Clerk session token.
 * Renders nothing so existing UI stays unchanged.
 */
export function AuthMeTest() {
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    void fetchAuthMe().catch(() => {
      // Signed-out users (or a missing token) cannot load /auth/me.
    });
  }, [isLoaded]);

  return null;
}
