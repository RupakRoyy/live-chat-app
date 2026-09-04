"use client";

import { useUser } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { getClerkErrorMessage } from "@/lib/clerk-errors";
import { getSafeRedirectPath } from "@/lib/redirect";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect_url"));
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace(redirectTo);
    }
  }, [isSignedIn, redirectTo, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || !signIn) return;

    setError(null);
    setPending(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace(redirectTo);
        return;
      }

      setError("Sign in needs another step. Try Google or check your email.");
    } catch (err) {
      setError(getClerkErrorMessage(err, "Could not sign in. Check your details and try again."));
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    if (!isLoaded || !signIn) return;

    setError(null);
    setPending(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(redirectTo)}`,
        redirectUrlComplete: redirectTo,
      });
    } catch (err) {
      setError(getClerkErrorMessage(err, "Google sign in did not start. Try again."));
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleButton label="Continue with Google" disabled={!isLoaded || pending} onClick={onGoogle} />

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@email.com"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
        />

        <AuthError message={error} />

        <Button type="submit" disabled={!isLoaded || pending} className="w-full py-3.5 text-base">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={`/sign-up?redirect_url=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-accent hover:text-accent-hover"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
