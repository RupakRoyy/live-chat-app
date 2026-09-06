"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { GenderSelector } from "@/components/GenderSelector";
import { LinkButton } from "@/components/ui/Button";
import type { GenderPreference } from "@/components/flow/types";

type AppHeaderProps = {
  entitlement?: {
    authenticated: boolean;
    trial: boolean;
    trialExpiresAt: string | null;
    loading?: boolean;
  };
  gender?: {
    value: GenderPreference;
    onChange: (value: GenderPreference) => void;
    isPro: boolean;
    loading?: boolean;
    ownGenderSet?: boolean;
    onNeedOwnGender?: () => void;
  };
};

function formatTrialExpiry(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AppHeader({ entitlement, gender }: AppHeaderProps) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [openPanel, setOpenPanel] = useState<"menu" | "gender" | null>(null);
  const menuOpen = openPanel === "menu";

  useEffect(() => {
    if (!gender) {
      setOpenPanel((current) => (current === "gender" ? null : current));
    }
  }, [gender]);

  const entitlementLoading = Boolean(entitlement?.loading);
  const authenticated = entitlement?.authenticated ?? Boolean(isSignedIn);
  const trialActive = Boolean(entitlement?.trial);
  const trialExpiry = entitlement?.trialExpiresAt
    ? formatTrialExpiry(entitlement.trialExpiresAt)
    : null;

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <BrandMark onDark />

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-col items-end gap-2 rounded-2xl border border-accent/35 bg-accent/10 px-2.5 py-2 shadow-[var(--shadow-accent)] sm:flex-row sm:items-center sm:gap-3 sm:px-3">
          {entitlementLoading && (authenticated || isSignedIn) ? (
            <p className="max-w-[16rem] text-right text-xs font-bold leading-snug text-accent sm:max-w-none sm:text-[0.8125rem]">
              Checking Pro status.
            </p>
          ) : !authenticated ? (
            <>
              <p className="max-w-[14.5rem] text-right text-xs font-bold leading-snug text-accent sm:max-w-none sm:text-[0.8125rem]">
                Sign up and unlock Pro features free for 24 hours.
              </p>
              <LinkButton href="/sign-up" className="shrink-0 px-3.5 py-2">
                Continue
              </LinkButton>
            </>
          ) : trialActive ? (
            <p className="max-w-[16rem] text-right text-xs font-bold leading-snug text-accent sm:max-w-none sm:text-[0.8125rem]">
              {trialExpiry
                ? `Pro trial active until ${trialExpiry}.`
                : "Pro trial is active."}
            </p>
          ) : (
            <p className="max-w-[16rem] text-right text-xs font-bold leading-snug text-accent sm:max-w-none sm:text-[0.8125rem]">
              Your Pro trial has ended. Specific gender is locked.
            </p>
          )}
        </div>

        {gender ? (
          <GenderSelector
            value={gender.value}
            onChange={gender.onChange}
            isPro={gender.isPro}
            loading={gender.loading}
            ownGenderSet={gender.ownGenderSet}
            onNeedOwnGender={gender.onNeedOwnGender}
            open={openPanel === "gender"}
            onOpenChange={(open) => setOpenPanel(open ? "gender" : null)}
          />
        ) : null}

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setOpenPanel(menuOpen ? null : "menu")}
            className="btn-press inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-charcoal/50 text-snow backdrop-blur-sm hover:bg-charcoal/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>

          {menuOpen ? (
            <div className="panel-card absolute right-0 top-14 w-52 overflow-hidden rounded-2xl">
              <p className="border-b border-border-strong px-4 py-3 text-xs font-medium text-charcoal/60">
                Menu
              </p>
              {isSignedIn ? (
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                  onClick={() => {
                    setOpenPanel(null);
                    void signOut();
                  }}
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                  onClick={() => setOpenPanel(null)}
                >
                  Sign in
                </Link>
              )}
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                onClick={() => setOpenPanel(null)}
              >
                Safety tips
              </button>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                onClick={() => setOpenPanel(null)}
              >
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
