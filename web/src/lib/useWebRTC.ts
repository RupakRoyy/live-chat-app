"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMode, MatchFoundPayload, MatchmakingSocket } from "./socket";
import {
  closePeerConnection,
  isOfferer,
  mediaConstraintsFor,
  RTC_CONFIGURATION,
  stopMediaStream,
} from "./webrtc";

type UseWebRTCOptions = {
  socket: MatchmakingSocket | null;
  socketId: string | null;
  match: MatchFoundPayload | null;
  mode: ChatMode;
  enabled: boolean;
  onPeerLeft?: () => void;
  onConnectionFailed?: () => void;
};

export type WebRtcConnectionState =
  | RTCPeerConnectionState
  | "idle"
  | "requesting-media";

function setTrackEnabled(
  stream: MediaStream | null,
  kind: "audio" | "video",
  enabled: boolean,
) {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    if (track.kind === kind) {
      track.enabled = enabled;
    }
  }
}

export function useWebRTC({
  socket,
  socketId,
  match,
  mode,
  enabled,
  onPeerLeft,
  onConnectionFailed,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<WebRtcConnectionState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const generationRef = useRef(0);
  const closingIntentionallyRef = useRef(false);
  const onPeerLeftRef = useRef(onPeerLeft);
  const onConnectionFailedRef = useRef(onConnectionFailed);

  onPeerLeftRef.current = onPeerLeft;
  onConnectionFailedRef.current = onConnectionFailed;

  const teardown = useCallback(() => {
    generationRef.current += 1;
    closingIntentionallyRef.current = true;
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;

    const peer = peerRef.current;
    peerRef.current = null;
    closePeerConnection(peer);

    const stream = localStreamRef.current;
    localStreamRef.current = null;
    stopMediaStream(stream);

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("idle");
    setMediaError(null);
    setMicOn(true);
    setCameraOn(true);
  }, []);

  const toggleMic = useCallback(() => {
    setMicOn((current) => {
      const next = !current;
      setTrackEnabled(localStreamRef.current, "audio", next);
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOn((current) => {
      const next = !current;
      setTrackEnabled(localStreamRef.current, "video", next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !socket || !socketId || !match) {
      teardown();
      return;
    }

    if (mode !== "voice" && mode !== "video") {
      teardown();
      return;
    }

    closingIntentionallyRef.current = false;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const signalingSocket = socket;
    const peerSocketId = match.peerSocketId;
    const shouldOffer = isOfferer(socketId, peerSocketId);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;

    function isCurrent(): boolean {
      return generationRef.current === generation;
    }

    async function flushCandidates(peer: RTCPeerConnection) {
      const queued = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];

      for (const candidate of queued) {
        try {
          await peer.addIceCandidate(candidate);
        } catch (error) {
          if (isCurrent()) {
            console.error("Failed to add queued ICE candidate:", error);
          }
        }
      }
    }

    async function handleRemoteOffer(
      peer: RTCPeerConnection,
      description: RTCSessionDescriptionInit,
    ) {
      await peer.setRemoteDescription(description);
      await flushCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      signalingSocket.emit("webrtc:answer", {
        to: peerSocketId,
        description: {
          type: "answer",
          sdp: answer.sdp ?? "",
        },
      });
    }

    function attachPeerHandlers(peer: RTCPeerConnection) {
      peer.onicecandidate = (event) => {
        if (!isCurrent() || !event.candidate) {
          return;
        }

        signalingSocket.emit("webrtc:ice-candidate", {
          to: peerSocketId,
          candidate: event.candidate.toJSON(),
        });
      };

      peer.ontrack = (event) => {
        if (!isCurrent()) {
          return;
        }

        setRemoteStream((current) => {
          const next = current
            ? new MediaStream(current.getTracks())
            : new MediaStream();

          if (event.track && !next.getTrackById(event.track.id)) {
            next.addTrack(event.track);
          }

          return next;
        });
        console.info("webrtc:remote-track", event.track.kind);
      };

      peer.onconnectionstatechange = () => {
        if (!isCurrent()) {
          return;
        }

        setConnectionState(peer.connectionState);
        console.info("webrtc:connectionstate", peer.connectionState);

        if (
          !closingIntentionallyRef.current &&
          (peer.connectionState === "failed" ||
            peer.connectionState === "closed")
        ) {
          onConnectionFailedRef.current?.();
        }
      };

      peer.oniceconnectionstatechange = () => {
        if (!isCurrent()) {
          return;
        }

        console.info("webrtc:iceconnectionstate", peer.iceConnectionState);

        if (
          !closingIntentionallyRef.current &&
          peer.iceConnectionState === "failed"
        ) {
          onConnectionFailedRef.current?.();
        }
      };
    }

    const onOffer = (payload: {
      from: string;
      description: RTCSessionDescriptionInit;
    }) => {
      if (!isCurrent() || payload.from !== peerSocketId) {
        return;
      }

      const peer = peerRef.current;
      if (!peer || peer.signalingState === "closed") {
        pendingOfferRef.current = payload.description;
        return;
      }

      void handleRemoteOffer(peer, payload.description).catch((error) => {
        console.error("Failed to handle remote offer:", error);
      });
    };

    const onAnswer = (payload: {
      from: string;
      description: RTCSessionDescriptionInit;
    }) => {
      if (!isCurrent() || payload.from !== peerSocketId) {
        return;
      }

      const peer = peerRef.current;
      if (!peer || peer.signalingState === "closed") {
        return;
      }

      void (async () => {
        await peer.setRemoteDescription(payload.description);
        await flushCandidates(peer);
      })().catch((error) => {
        console.error("Failed to handle remote answer:", error);
      });
    };

    const onIceCandidate = (payload: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (!isCurrent() || payload.from !== peerSocketId) {
        return;
      }

      const peer = peerRef.current;
      if (!peer || !peer.remoteDescription) {
        pendingCandidatesRef.current.push(payload.candidate);
        return;
      }

      void peer.addIceCandidate(payload.candidate).catch((error) => {
        if (isCurrent()) {
          console.error("Failed to add ICE candidate:", error);
        }
      });
    };

    const onPeerLeftEvent = (payload: { peerSocketId: string }) => {
      if (!isCurrent() || payload.peerSocketId !== peerSocketId) {
        return;
      }

      console.info("webrtc:peer-left", payload);
      onPeerLeftRef.current?.();
    };

    signalingSocket.on("webrtc:offer", onOffer);
    signalingSocket.on("webrtc:answer", onAnswer);
    signalingSocket.on("webrtc:ice-candidate", onIceCandidate);
    signalingSocket.on("webrtc:peer-left", onPeerLeftEvent);

    void (async () => {
      setConnectionState("requesting-media");
      setMediaError(null);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          mediaConstraintsFor(mode),
        );
      } catch (error) {
        if (!isCurrent()) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to access media devices";
        setMediaError(message);
        setConnectionState("idle");
        console.error("getUserMedia failed:", error);
        return;
      }

      if (!isCurrent()) {
        stopMediaStream(stream);
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const peer = new RTCPeerConnection(RTC_CONFIGURATION);
      peerRef.current = peer;
      attachPeerHandlers(peer);

      for (const track of stream.getTracks()) {
        peer.addTrack(track, stream);
      }

      console.info("webrtc:local-tracks", {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
        role: shouldOffer ? "offerer" : "answerer",
      });

      const queuedOffer = pendingOfferRef.current;
      pendingOfferRef.current = null;

      try {
        if (queuedOffer) {
          await handleRemoteOffer(peer, queuedOffer);
        } else if (shouldOffer) {
          const offer = await peer.createOffer();
          if (!isCurrent()) {
            return;
          }

          await peer.setLocalDescription(offer);
          signalingSocket.emit("webrtc:offer", {
            to: peerSocketId,
            description: {
              type: "offer",
              sdp: offer.sdp ?? "",
            },
          });
          console.info("webrtc:offer-created");
        }
      } catch (error) {
        console.error("Failed to start WebRTC negotiation:", error);
      }
    })();

    return () => {
      signalingSocket.off("webrtc:offer", onOffer);
      signalingSocket.off("webrtc:answer", onAnswer);
      signalingSocket.off("webrtc:ice-candidate", onIceCandidate);
      signalingSocket.off("webrtc:peer-left", onPeerLeftEvent);
      teardown();
    };
  }, [enabled, match, mode, socket, socketId, teardown]);

  return {
    localStream,
    remoteStream,
    connectionState,
    micOn,
    cameraOn,
    mediaError,
    toggleMic,
    toggleCamera,
  };
}
