"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChatView } from "@/components/chat/ChatView";
import { LandingView } from "@/components/flow/LandingView";
import { StatusView } from "@/components/flow/StatusView";
import type { AppState, ChatMode } from "@/components/flow/types";

export function AppFlow() {
  const [state, setState] = useState<AppState>("landing");
  const [mode, setMode] = useState<ChatMode>("video");

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 app-backdrop" />

      <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
        <AppHeader />

        {state === "landing" ? (
          <LandingView
            mode={mode}
            onModeChange={setMode}
            onStart={() => setState("finding")}
          />
        ) : null}

        {state === "finding" ||
        state === "connecting" ||
        state === "disconnected" ||
        state === "ended" ? (
          <StatusView
            state={state}
            onBackHome={() => setState("landing")}
            onContinue={
              state === "finding"
                ? () => setState("connecting")
                : state === "connecting"
                  ? () => setState("chat")
                  : undefined
            }
          />
        ) : null}

        {state === "chat" ? (
          <ChatView
            mode={mode}
            onNext={() => setState("finding")}
            onEnd={() => setState("ended")}
            onPartnerLeft={() => setState("disconnected")}
          />
        ) : null}
      </div>
    </div>
  );
}
