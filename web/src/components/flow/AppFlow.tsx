"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChatView } from "@/components/chat/ChatView";
import { OwnGenderSetup } from "@/components/OwnGenderSetup";
import { LandingView } from "@/components/flow/LandingView";
import { StatusView } from "@/components/flow/StatusView";
import {
  canSelectGenderPreference,
  type AppState,
  type ChatMode,
  type GenderPreference,
  type OwnGender,
} from "@/components/flow/types";
import { updateOwnGender } from "@/lib/api";
import { isMessagingMode, type MatchmakingErrorPayload } from "@/lib/socket";
import { useMatchmaking } from "@/lib/useMatchmaking";
import { useMessaging } from "@/lib/useMessaging";
import { useProStatus } from "@/lib/useProStatus";
import { useWebRTC } from "@/lib/useWebRTC";

export function AppFlow() {
  const [state, setState] = useState<AppState>("landing");
  const [mode, setMode] = useState<ChatMode>("video");
  const [gender, setGender] = useState<GenderPreference>("any");
  const [ownGenderPrompt, setOwnGenderPrompt] = useState<
    "hidden" | "welcome" | "required"
  >("hidden");
  const [pendingPreference, setPendingPreference] =
    useState<GenderPreference | null>(null);
  const [savingOwnGender, setSavingOwnGender] = useState(false);
  const [ownGenderError, setOwnGenderError] = useState<string | null>(null);
  const {
    authenticated,
    isPro,
    trial,
    trialExpiresAt,
    ownGender,
    loading: proLoading,
    refresh,
  } = useProStatus();
  const startLockRef = useRef(false);
  const skippedOwnGenderRef = useRef(false);

  const handleMatchmakingError = useCallback(
    (error: MatchmakingErrorPayload) => {
      startLockRef.current = false;
      setGender("any");
      setPendingPreference(null);

      if (error.code === "own_gender_required") {
        setOwnGenderPrompt("required");
        setState("landing");
      }
    },
    [],
  );

  const { match, socket, socketId, join, cancel, leave } = useMatchmaking({
    onError: handleMatchmakingError,
  });

  const handlePartnerLeft = useCallback(() => {
    leave();
    startLockRef.current = false;
    setState("disconnected");
  }, [leave]);

  useEffect(() => {
    if (!socket || !match) {
      return;
    }

    const currentSocket = socket;
    const peerSocketId = match.peerSocketId;

    const onPeerLeft = (payload: { peerSocketId: string }) => {
      if (payload.peerSocketId !== peerSocketId) {
        return;
      }

      handlePartnerLeft();
    };

    currentSocket.on("webrtc:peer-left", onPeerLeft);
    return () => {
      currentSocket.off("webrtc:peer-left", onPeerLeft);
    };
  }, [handlePartnerLeft, match, socket]);

  const media = useWebRTC({
    socket,
    socketId,
    match,
    mode,
    enabled: state === "chat" && Boolean(match) && mode !== "text",
    onPeerLeft: handlePartnerLeft,
    onConnectionFailed: handlePartnerLeft,
  });

  const messaging = useMessaging({
    socket,
    socketId,
    match,
    enabled: state === "chat" && Boolean(match) && isMessagingMode(mode),
  });

  useEffect(() => {
    if (proLoading) {
      return;
    }

    if (!canSelectGenderPreference(gender, isPro)) {
      setGender("any");
    }
  }, [gender, isPro, proLoading]);

  useEffect(() => {
    if (proLoading || !authenticated || ownGender || skippedOwnGenderRef.current) {
      return;
    }

    if (state !== "landing") {
      return;
    }

    setOwnGenderPrompt((current) => (current === "hidden" ? "welcome" : current));
  }, [authenticated, ownGender, proLoading, state]);

  useEffect(() => {
    if (ownGender) {
      setOwnGenderPrompt("hidden");
      setOwnGenderError(null);
    }
  }, [ownGender]);

  useEffect(() => {
    if (!match) {
      return;
    }

    if (state === "finding" || state === "connecting") {
      setState("chat");
    }
  }, [match, state]);

  function resolvedPreference(activePro = isPro): GenderPreference {
    return canSelectGenderPreference(gender, activePro) ? gender : "any";
  }

  function handleNeedOwnGender(nextPreference?: GenderPreference) {
    if (nextPreference && nextPreference !== "any") {
      setPendingPreference(nextPreference);
    }

    setOwnGenderPrompt("required");
  }

  function handleGenderChange(next: GenderPreference) {
    if (!canSelectGenderPreference(next, isPro)) {
      return;
    }

    if (next !== "any" && !ownGender) {
      handleNeedOwnGender(next);
      return;
    }

    setGender(next);
  }

  function handleSkipOwnGender() {
    skippedOwnGenderRef.current = true;
    setPendingPreference(null);
    setOwnGenderError(null);
    setOwnGenderPrompt("hidden");
    setGender("any");
  }

  async function handleSaveOwnGender(value: OwnGender) {
    setSavingOwnGender(true);
    setOwnGenderError(null);

    try {
      await updateOwnGender(value);
      await refresh();
      setOwnGenderPrompt("hidden");
      if (pendingPreference && canSelectGenderPreference(pendingPreference, isPro)) {
        setGender(pendingPreference);
      }
      setPendingPreference(null);
    } catch {
      setOwnGenderError("Could not save your gender. Try again.");
    } finally {
      setSavingOwnGender(false);
    }
  }

  async function handleStart() {
    if (startLockRef.current) {
      return;
    }

    startLockRef.current = true;

    try {
      const snapshot = await refresh();
      const preference = resolvedPreference(snapshot.canUseSpecificGender);

      if (preference !== gender) {
        setGender("any");
      }

      if (preference !== "any" && !snapshot.ownGender) {
        startLockRef.current = false;
        handleNeedOwnGender(preference);
        return;
      }

      setState("finding");
      await join({
        mode,
        preference,
      });
    } catch {
      startLockRef.current = false;
    }
  }

  function handleCancelOrHome() {
    cancel();
    startLockRef.current = false;
    setState("landing");
  }

  async function handleNext() {
    leave();
    startLockRef.current = true;

    try {
      const snapshot = await refresh();
      const preference = resolvedPreference(snapshot.canUseSpecificGender);

      if (preference !== gender) {
        setGender("any");
      }

      if (preference !== "any" && !snapshot.ownGender) {
        startLockRef.current = false;
        handleNeedOwnGender(preference);
        return;
      }

      setState("finding");
      await join({
        mode,
        preference,
      });
    } catch {
      startLockRef.current = false;
    }
  }

  function handleEnd() {
    leave();
    startLockRef.current = false;
    setState("ended");
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 app-backdrop" />

      <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
        <AppHeader
          entitlement={{
            authenticated,
            trial,
            trialExpiresAt,
            loading: proLoading,
          }}
          gender={
            state === "landing" || ownGenderPrompt !== "hidden"
              ? undefined
              : {
                  value: gender,
                  onChange: handleGenderChange,
                  isPro,
                  loading: proLoading,
                  ownGenderSet: Boolean(ownGender),
                  onNeedOwnGender: () => handleNeedOwnGender(),
                }
          }
        />

        {ownGenderPrompt !== "hidden" ? (
          <OwnGenderSetup
            saving={savingOwnGender}
            error={ownGenderError}
            required={ownGenderPrompt === "required"}
            onSave={handleSaveOwnGender}
            onSkip={handleSkipOwnGender}
          />
        ) : null}

        {ownGenderPrompt === "hidden" && state === "landing" ? (
          <LandingView
            mode={mode}
            onModeChange={setMode}
            onStart={handleStart}
          />
        ) : null}

        {ownGenderPrompt === "hidden" &&
        (state === "finding" ||
          state === "connecting" ||
          state === "disconnected" ||
          state === "ended") ? (
          <StatusView
            state={state}
            onBackHome={handleCancelOrHome}
          />
        ) : null}

        {ownGenderPrompt === "hidden" && state === "chat" ? (
          <ChatView
            mode={mode}
            matchId={match?.matchId}
            onNext={handleNext}
            onEnd={handleEnd}
            onPartnerLeft={handlePartnerLeft}
            localStream={media.localStream}
            remoteStream={media.remoteStream}
            connectionState={media.connectionState}
            micOn={media.micOn}
            cameraOn={media.cameraOn}
            onToggleMic={media.toggleMic}
            onToggleCamera={media.toggleCamera}
            messages={messaging.messages}
            canSend={messaging.canSend}
            onSendMessage={messaging.sendMessage}
          />
        ) : null}
      </div>
    </div>
  );
}
