"use client";

import {
  canSelectGenderPreference,
  genderPreferenceLabels,
  type GenderPreference,
} from "@/components/flow/types";

function GenderSymbolIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="8.4" cy="8.6" r="3.15" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.4 11.75V18.4M6.15 16.15h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="15.1" cy="13.2" r="3.15" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M17.35 10.95 21 7.3M17.15 7.3H21V11.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockBadge() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="7"
        width="9"
        height="6.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.25 7V5.35a2.75 2.75 0 0 1 5.5 0V7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const genders: GenderPreference[] = ["any", "female", "male"];

type GenderSelectorProps = {
  value: GenderPreference;
  onChange: (value: GenderPreference) => void;
  isPro: boolean;
  loading?: boolean;
  ownGenderSet?: boolean;
  onNeedOwnGender?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GenderSelector({
  value,
  onChange,
  isPro,
  loading = false,
  ownGenderSet = true,
  onNeedOwnGender,
  open,
  onOpenChange,
}: GenderSelectorProps) {
  const locked = !loading && !isPro;

  function handleToggle() {
    if (loading) {
      return;
    }

    onOpenChange(!open);
  }

  function handleSelect(next: GenderPreference) {
    if (!canSelectGenderPreference(next, isPro)) {
      return;
    }

    if (next !== "any" && !ownGenderSet) {
      onNeedOwnGender?.();
      onOpenChange(false);
      return;
    }

    onChange(next);
    onOpenChange(false);
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={
          locked
            ? "Gender preference locked"
            : "Gender preference"
        }
        aria-expanded={open}
        aria-haspopup="true"
        aria-busy={loading}
        onClick={handleToggle}
        className={`btn-press relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          locked || loading
            ? "cursor-pointer border-border bg-charcoal/30 text-muted"
            : "border-border bg-charcoal/50 text-snow hover:bg-charcoal/70"
        }`}
      >
        <GenderSymbolIcon />
        {locked ? (
          <span className="absolute bottom-1 right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-charcoal text-muted">
            <LockBadge />
          </span>
        ) : null}
      </button>

      {open && !loading && locked ? (
        <div className="panel-card absolute right-0 top-14 z-30 w-[min(16.5rem,calc(100vw-2rem))] rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold leading-snug text-charcoal">
            Upgrade to Pro to choose a specific gender.
          </p>
        </div>
      ) : null}

      {open && !loading && isPro ? (
        <div className="panel-card absolute right-0 top-14 z-30 w-52 overflow-hidden rounded-2xl">
          <p className="border-b border-border-strong px-4 py-3 text-xs font-medium text-charcoal/60">
            {ownGenderSet ? "Gender" : "Set your gender first"}
          </p>
          {genders.map((item) => {
            const selected = item === value;

            return (
              <button
                key={item}
                type="button"
                className={`block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-chiffon ${
                  selected ? "bg-chiffon text-charcoal" : "text-charcoal"
                }`}
                onClick={() => handleSelect(item)}
              >
                {genderPreferenceLabels[item]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
