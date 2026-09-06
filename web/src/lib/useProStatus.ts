"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { ANONYMOUS_AUTH_ME, fetchAuthMe, type AuthMeResponse } from "./api";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useProStatus() {
  const { isLoaded, isSignedIn } = useAuth();
  const [entitlement, setEntitlement] = useState<AuthMeResponse>(ANONYMOUS_AUTH_ME);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const status = await fetchAuthMe();
      setEntitlement(status);
      return status.canUseSpecificGender;
    } catch {
      setEntitlement(ANONYMOUS_AUTH_ME);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void refresh().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, refresh]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && isLoaded) {
        void refresh();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoaded, refresh]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLoaded, refresh]);

  useEffect(() => {
    if (!entitlement.trial || !entitlement.trialExpiresAt) {
      return;
    }

    const expiresAt = Date.parse(entitlement.trialExpiresAt);
    if (!Number.isFinite(expiresAt)) {
      return;
    }

    const delay = Math.max(0, expiresAt - Date.now()) + 500;
    const timer = window.setTimeout(() => {
      void refresh();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [entitlement.trial, entitlement.trialExpiresAt, refresh]);

  return {
    authenticated: entitlement.authenticated,
    userId: entitlement.userId ?? null,
    isPro: entitlement.pro,
    trial: entitlement.trial,
    trialExpiresAt: entitlement.trialExpiresAt ?? null,
    canUseSpecificGender: entitlement.canUseSpecificGender,
    loading: !isLoaded || loading,
    refresh,
  };
}
