"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6">
      <BrandMark onDark />

      <div className="relative">
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
    </header>
  );
}
