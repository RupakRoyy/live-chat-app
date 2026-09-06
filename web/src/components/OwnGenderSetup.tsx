"use client";

import { Button } from "@/components/ui/Button";
import { ownGenderLabels, type OwnGender } from "@/components/flow/types";

const genders: OwnGender[] = ["female", "male"];

type OwnGenderSetupProps = {
  saving?: boolean;
  error?: string | null;
  required?: boolean;
  onSave: (gender: OwnGender) => void;
  onSkip?: () => void;
};

export function OwnGenderSetup({
  saving = false,
  error,
  required = false,
  onSave,
  onSkip,
}: OwnGenderSetupProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-1 sm:px-6">
      <div className="animate-fade-up landing-card w-full max-w-md rounded-[2rem] px-7 py-9 text-center sm:px-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Your gender
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-snow sm:text-3xl">
          Set your gender
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {required
            ? "Specific gender matching needs your own gender first. Any Gender still works if you skip."
            : "Used for gender-based matching. You can skip and keep using Any Gender."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {genders.map((item) => (
            <Button
              key={item}
              onClick={() => onSave(item)}
              disabled={saving}
              className="w-full py-3"
            >
              {ownGenderLabels[item]}
            </Button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-accent">{error}</p>
        ) : null}

        {onSkip ? (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={saving}
            className="mt-4 w-full"
          >
            Skip for now
          </Button>
        ) : null}
      </div>
    </div>
  );
}
