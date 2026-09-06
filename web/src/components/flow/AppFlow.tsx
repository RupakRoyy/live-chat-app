"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { isMessagingMode } from "@/lib/socket";
import { useMatchmaking } from "@/lib/useMatchmaking";
import { useMessaging } from "@/lib/useMessaging";
import { useProStatus } from "@/lib/useProStatus";
import { useWebRTC } from "@/lib/useWebRTC";

export function AppFlow() {
  const [state, setState] = useState<AppState>("landing");
  const [mode, setMode] = useState<ChatMode>("video");
  const [gender, setGender] = useState<GenderPreference>("any");
  const {
    authenticated,
    isPro,
    trial,
    trialExpiresAt,
    loading: proLoading,
    refresh,
  } = useProStatus();
  const { match, socket, socketId, join, cancel, leave } = useMatchmaking();
  const startLockRef = useRef(false);

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

  function handleGenderChange(next: GenderPreference) {
    if (!canSelectGenderPreference(next, isPro)) {
      return;
    }

    setGender(next);
  }

  async function handleStart() {
    if (startLockRef.current) {
      return;
    }

    startLockRef.current = true;

    try {
      const activePro = await refresh();
      const preference = resolvedPreference(activePro);

      if (preference !== gender) {
        setGender("any");
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
      const activePro = await refresh();
      const preference = resolvedPreference(activePro);

      if (preference !== gender) {
        setGender("any");
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
            onBackHome={handleCancelOrHome}
          />
        ) : null}

        {state === "chat" ? (
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
