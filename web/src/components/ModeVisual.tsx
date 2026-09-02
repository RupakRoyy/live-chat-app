"use client";

import type { ChatMode } from "@/components/flow/types";

type ModeVisualProps = {
  mode: ChatMode;
};

export function ModeVisual({ mode }: ModeVisualProps) {
  return (
    <div
      className="relative mx-auto flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl"
      aria-hidden
    >
      {mode === "text" ? (
        <div key="text" className="animate-mode-enter relative h-full w-full">
          <div className="mode-bubble mode-bubble-1 absolute left-5 top-7 max-w-[7.5rem] rounded-2xl rounded-bl-sm border border-border-strong bg-charcoal px-3 py-2 text-[11px] font-semibold text-snow shadow-lg">
            Hey! 👋
          </div>
          <div className="mode-bubble mode-bubble-2 absolute right-5 top-14 max-w-[8.5rem] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-[11px] font-bold text-on-accent shadow-lg">
            What&apos;s up?
          </div>
          <div className="mode-bubble mode-bubble-3 absolute bottom-8 left-8 max-w-[9rem] rounded-2xl rounded-bl-sm border border-border-strong bg-snow px-3 py-2 text-[11px] font-semibold text-charcoal shadow-lg">
            Ready to chat?
          </div>
        </div>
      ) : null}

      {mode === "voice" ? (
        <div
          key="voice"
          className="animate-mode-enter relative flex h-full w-full flex-col items-center justify-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="voice-ripple absolute inset-0 rounded-full border-2 border-accent" />
            <span className="voice-ripple voice-ripple-2 absolute inset-0 rounded-full border-2 border-accent" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-accent text-on-accent shadow-[var(--shadow-accent)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <rect
                  x="9"
                  y="4"
                  width="6"
                  height="11"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
          <div className="mt-4 flex h-10 items-end gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`wave-bar wave-bar-${i} w-2 rounded-full bg-accent`}
                style={{ height: `${12 + i * 4}px` }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {mode === "video" ? (
        <div
          key="video"
          className="animate-mode-enter relative flex h-full w-full items-center justify-center"
        >
          <div className="video-frame relative h-28 w-44 overflow-hidden rounded-2xl border border-border-strong bg-video-stage shadow-lg">
            <span className="frame-corner absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-accent" />
            <span className="frame-corner absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-accent" />
            <span className="frame-corner absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-accent" />
            <span className="frame-corner absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/25 text-accent">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <rect
                    x="3"
                    y="6"
                    width="13"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 10.5 21 8v8l-5-2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="absolute bottom-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-accent">
              Live
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
