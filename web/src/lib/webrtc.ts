export const GOOGLE_STUN_URL = "stun:stun.l.google.com:19302";

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: GOOGLE_STUN_URL }],
};

export type WebRtcChatMode = "voice" | "video";

export function isOfferer(localSocketId: string, peerSocketId: string): boolean {
  return localSocketId < peerSocketId;
}

export function mediaConstraintsFor(
  mode: WebRtcChatMode,
): MediaStreamConstraints {
  if (mode === "video") {
    return { audio: true, video: true };
  }

  return { audio: true, video: false };
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function closePeerConnection(
  peer: RTCPeerConnection | null | undefined,
): void {
  if (!peer) {
    return;
  }

  peer.ontrack = null;
  peer.onicecandidate = null;
  peer.onconnectionstatechange = null;
  peer.oniceconnectionstatechange = null;
  peer.onsignalingstatechange = null;

  try {
    peer.close();
  } catch {
    // Already closed.
  }
}
