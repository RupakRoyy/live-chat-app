import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SSOCallback } from "@/components/auth/SSOCallback";

export const metadata: Metadata = {
  title: "Signing in | Live Chat",
};

export default function SSOCallbackPage() {
  return (
    <AuthShell title="Almost there" subtitle="Completing your Google sign in.">
      <Suspense
        fallback={<p className="text-center text-sm text-muted">Finishing sign in…</p>}
      >
        <SSOCallback />
      </Suspense>
    </AuthShell>
  );
}
