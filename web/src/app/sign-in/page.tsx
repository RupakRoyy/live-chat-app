import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in | Live Chat",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep chatting with strangers."
    >
      <Suspense
        fallback={<p className="text-center text-sm text-muted">Loading…</p>}
      >
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
