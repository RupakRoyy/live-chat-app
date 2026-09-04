"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSafeRedirectPath } from "@/lib/redirect";

export function SSOCallback() {
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect_url"));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    clerk
      .handleRedirectCallback({
        signInFallbackRedirectUrl: redirectTo,
        signUpFallbackRedirectUrl: redirectTo,
      })
      .catch(() => {
        setFailed(true);
        router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
      });
  }, [clerk, redirectTo, router]);

  return (
    <p className="text-center text-sm text-muted">
      {failed ? "Returning to sign in…" : "Finishing sign in…"}
    </p>
  );
}
