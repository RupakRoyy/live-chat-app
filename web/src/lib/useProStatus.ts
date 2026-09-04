"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { fetchProStatus } from "./api";

export function useProStatus() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setIsPro(false);
      return false;
    }

    try {
      const status = await fetchProStatus();
      setIsPro(status.isPro);
      return status.isPro;
    } catch {
      setIsPro(false);
      return false;
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void refresh()
      .catch(() => {
        if (!cancelled) {
          setIsPro(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, refresh]);

  return {
    isPro,
    loading: !isLoaded || loading,
    refresh,
  };
}
