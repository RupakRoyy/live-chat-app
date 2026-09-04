"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LinkButton } from "@/components/ui/Button";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <BrandMark onDark />

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-col items-end gap-2 rounded-2xl border border-accent/35 bg-accent/10 px-2.5 py-2 shadow-[var(--shadow-accent)] sm:flex-row sm:items-center sm:gap-3 sm:px-3">
          <p className="max-w-[14.5rem] text-right text-xs font-bold leading-snug text-accent sm:max-w-none sm:text-[0.8125rem]">
            Sign up and unlock Pro features free for 24 hours.
          </p>
          <LinkButton href="/sign-up" className="shrink-0 px-3.5 py-2">
            Continue
          </LinkButton>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
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
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                onClick={() => setMenuOpen(false)}
              >
                Safety tips
              </button>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm font-semibold text-charcoal hover:bg-chiffon"
                onClick={() => setMenuOpen(false)}
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
