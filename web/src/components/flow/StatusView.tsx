import { Button } from "@/components/ui/Button";
import type { AppState } from "@/components/flow/types";

type StatusViewProps = {
  state: Extract<AppState, "finding" | "connecting" | "disconnected" | "ended">;
  onContinue?: () => void;
  onBackHome: () => void;
};

const copy: Record<
  StatusViewProps["state"],
  {
    eyebrow: string;
    title: string;
    body: string;
    primary?: string;
    showSpinner?: boolean;
  }
> = {
  finding: {
    eyebrow: "Searching",
    title: "Finding a stranger…",
    body: "Looking for someone to chat with. Matchmaking is a UI preview for now.",
    primary: "Continue preview",
    showSpinner: true,
  },
  connecting: {
    eyebrow: "Almost there",
    title: "Connecting…",
    body: "Setting up your chat. Real media and signaling come later.",
    primary: "Enter chat preview",
    showSpinner: true,
  },
  disconnected: {
    eyebrow: "Session update",
    title: "Partner disconnected",
    body: "They left the chat. Head home and start fresh whenever you want.",
    primary: "Back to home",
  },
  ended: {
    eyebrow: "All done",
    title: "Chat ended",
    body: "Thanks for chatting. Come back anytime for another conversation.",
    primary: "Back to home",
  },
};

export function StatusView({ state, onContinue, onBackHome }: StatusViewProps) {
  const content = copy[state];
  const primaryAction =
    state === "finding" || state === "connecting" ? onContinue : onBackHome;

  return (
    <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-1 sm:px-6">
      <div className="animate-fade-up landing-card w-full max-w-md rounded-[2rem] px-7 py-9 text-center sm:px-9">
        {content.showSpinner ? (
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15"
            aria-hidden
          >
            <div className="h-8 w-8 rounded-full border-[3px] border-snow/15 border-t-accent animate-spin-slow" />
          </div>
        ) : (
          <div
            className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-lg font-bold text-on-accent"
            aria-hidden
          >
            ✓
          </div>
        )}

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-snow sm:text-3xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {content.body}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {content.primary && primaryAction ? (
            <Button onClick={primaryAction} className="w-full py-3">
              {content.primary}
            </Button>
          ) : null}

          {state === "finding" || state === "connecting" ? (
            <Button variant="ghost" onClick={onBackHome} className="w-full">
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
