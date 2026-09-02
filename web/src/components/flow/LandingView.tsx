"use client";

import { BrandMark } from "@/components/BrandMark";
import { ConnectIllustration } from "@/components/ConnectIllustration";
import { ModeSelector } from "@/components/ModeSelector";
import { ModeVisual } from "@/components/ModeVisual";
import { Button } from "@/components/ui/Button";
import { startChatLabels, type ChatMode } from "@/components/flow/types";

type LandingViewProps = {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onStart: () => void;
};

export function LandingView({ mode, onModeChange, onStart }: LandingViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-1 sm:px-6">
      <div className="animate-fade-up landing-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="flex justify-center border-b border-border pb-5">
          <BrandMark href={null} size="lg" />
        </div>

        <div className="animate-fade-up-delay mt-5 opacity-90">
          <ConnectIllustration />
        </div>

        <div className="animate-fade-up-delay mt-2 text-center">
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-snow sm:text-[2.15rem]">
            Chat with Strangers
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Meet someone new in seconds. Pick text, voice, or video.
          </p>
        </div>

        <div className="animate-fade-up-delay-2 mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-dot absolute inset-0 rounded-full bg-accent" />
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            People online now
          </span>
        </div>

        <div className="animate-fade-up-delay-2 mode-stage mt-6">
          <ModeVisual mode={mode} />
        </div>

        <div className="animate-fade-up-delay-2 mt-5">
          <ModeSelector mode={mode} onChange={onModeChange} />
        </div>

        <Button
          onClick={onStart}
          className="animate-fade-up-delay-2 mt-5 w-full py-3.5 text-base"
        >
          {startChatLabels[mode]}
        </Button>

        <p className="animate-fade-up-delay-2 mt-4 text-center text-xs leading-relaxed text-muted">
          Be respectful. Report or leave anytime. Your privacy matters.
        </p>
      </div>
    </div>
  );
}
