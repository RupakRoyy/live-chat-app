"use client";

import { useUser } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthError } from "@/components/auth/AuthError";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { getClerkErrorMessage } from "@/lib/clerk-errors";
import { getSafeRedirectPath } from "@/lib/redirect";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect_url"));
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace(redirectTo);
    }
  }, [isSignedIn, redirectTo, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || !signUp) return;

    setError(null);
    setPending(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(getClerkErrorMessage(err, "Could not create your account. Try again."));
    } finally {
      setPending(false);
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || !signUp) return;

    setError(null);
    setPending(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace(redirectTo);
        return;
      }

      setError("Verification is not complete yet. Check the code and try again.");
    } catch (err) {
      setError(getClerkErrorMessage(err, "That code did not work. Try again."));
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    if (!isLoaded || !signUp) return;

    setError(null);
    setPending(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(redirectTo)}`,
        redirectUrlComplete: redirectTo,
      });
    } catch (err) {
      setError(getClerkErrorMessage(err, "Google sign up did not start. Try again."));
      setPending(false);
    }
  }

  if (pendingVerification) {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          Enter the verification code we sent to {email}.
        </p>
        <AuthField
          id="code"
          label="Verification code"
          type="text"
          value={code}
          onChange={setCode}
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <AuthError message={error} />
        <Button type="submit" disabled={!isLoaded || pending} className="w-full py-3.5 text-base">
          {pending ? "Verifying…" : "Verify email"}
        </Button>
      </form>
    );
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
          autoComplete="new-password"
          placeholder="Create a password"
        />

        <AuthError message={error} />

        <Button type="submit" disabled={!isLoaded || pending} className="w-full py-3.5 text-base">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-accent hover:text-accent-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
