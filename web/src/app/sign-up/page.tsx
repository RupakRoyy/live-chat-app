import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign up | Live Chat",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Live Chat and meet someone new."
    >
      <Suspense
        fallback={<p className="text-center text-sm text-muted">Loading…</p>}
      >
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
