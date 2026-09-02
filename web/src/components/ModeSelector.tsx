import type { ChatMode } from "@/components/flow/types";

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M5 6h14M5 12h10M5 18h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="9" y="4" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 10.5 21 8v8l-5-2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const modeConfig: Record<
  ChatMode,
  { label: string; icon: React.ReactNode }
> = {
  text: { label: "Text", icon: <TextIcon /> },
  voice: { label: "Voice", icon: <VoiceIcon /> },
  video: { label: "Video", icon: <VideoIcon /> },
};

type ModeSelectorProps = {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
};

const modes: ChatMode[] = ["text", "voice", "video"];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="tablist"
      aria-label="Chat mode"
    >
      {modes.map((item) => {
        const selected = item === mode;
        const { label, icon } = modeConfig[item];

        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item)}
            className={`btn-press flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all duration-200 ${
              selected
                ? "border-accent bg-accent text-on-accent shadow-[var(--shadow-accent)]"
                : "border-border bg-charcoal/40 text-snow hover:border-border-strong hover:bg-charcoal/60"
            }`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${
                selected ? "bg-charcoal/15" : "bg-snow/10"
              }`}
            >
              {icon}
            </span>
            <span className="text-xs font-bold tracking-wide sm:text-sm">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
