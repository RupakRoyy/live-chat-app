"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChatView } from "@/components/chat/ChatView";
import { LandingView } from "@/components/flow/LandingView";
import { StatusView } from "@/components/flow/StatusView";
import {
  canSelectGenderPreference,
  type AppState,
  type ChatMode,
  type GenderPreference,
} from "@/components/flow/types";
import { useProStatus } from "@/lib/useProStatus";

export function AppFlow() {
  const [state, setState] = useState<AppState>("landing");
  const [mode, setMode] = useState<ChatMode>("video");
  const [gender, setGender] = useState<GenderPreference>("any");
  const { isPro, loading: proLoading, refresh } = useProStatus();

  useEffect(() => {
    if (proLoading) {
      return;
    }

    if (!canSelectGenderPreference(gender, isPro)) {
      setGender("any");
    }
  }, [gender, isPro, proLoading]);

  function handleGenderChange(next: GenderPreference) {
    if (!canSelectGenderPreference(next, isPro)) {
      return;
    }

    setGender(next);
  }

  async function handleStart() {
    const activePro = await refresh();

    if (!canSelectGenderPreference(gender, activePro)) {
      setGender("any");
    }

    setState("finding");
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 app-backdrop" />

      <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
        <AppHeader
          gender={
            state === "landing"
              ? undefined
              : {
                  value: gender,
                  onChange: handleGenderChange,
                  isPro,
                  loading: proLoading,
                }
          }
        />

        {state === "landing" ? (
          <LandingView
            mode={mode}
            onModeChange={setMode}
            onStart={handleStart}
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
