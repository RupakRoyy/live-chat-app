export type SignalingDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type SignalingIceCandidate = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

export type WebRtcOfferPayload = {
  to: string;
  description: SignalingDescription;
};

export type WebRtcAnswerPayload = {
  to: string;
  description: SignalingDescription;
};

export type WebRtcIceCandidatePayload = {
  to: string;
  candidate: SignalingIceCandidate;
};

export type WebRtcOfferIncoming = {
  from: string;
  description: SignalingDescription;
};

export type WebRtcAnswerIncoming = {
  from: string;
  description: SignalingDescription;
};

export type WebRtcIceCandidateIncoming = {
  from: string;
  candidate: SignalingIceCandidate;
};

export type WebRtcPeerLeftPayload = {
  peerSocketId: string;
};

export interface SignalingClientToServerEvents {
  "webrtc:offer": (payload: WebRtcOfferPayload) => void;
  "webrtc:answer": (payload: WebRtcAnswerPayload) => void;
  "webrtc:ice-candidate": (payload: WebRtcIceCandidatePayload) => void;
}

export interface SignalingServerToClientEvents {
  "webrtc:offer": (payload: WebRtcOfferIncoming) => void;
  "webrtc:answer": (payload: WebRtcAnswerIncoming) => void;
  "webrtc:ice-candidate": (payload: WebRtcIceCandidateIncoming) => void;
  "webrtc:peer-left": (payload: WebRtcPeerLeftPayload) => void;
}

export function isSignalingDescription(
  value: unknown,
): value is SignalingDescription {
  if (!value || typeof value !== "object") {
    return false;
  }

  const description = value as Partial<SignalingDescription>;
  return (
    (description.type === "offer" || description.type === "answer") &&
    typeof description.sdp === "string"
  );
}

export function isIceCandidate(value: unknown): value is SignalingIceCandidate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    candidate.candidate !== undefined &&
    typeof candidate.candidate !== "string"
  ) {
    return false;
  }

  if (
    candidate.sdpMid !== undefined &&
    candidate.sdpMid !== null &&
    typeof candidate.sdpMid !== "string"
  ) {
    return false;
  }

  if (
    candidate.sdpMLineIndex !== undefined &&
    candidate.sdpMLineIndex !== null &&
    typeof candidate.sdpMLineIndex !== "number"
  ) {
    return false;
  }

  if (
    candidate.usernameFragment !== undefined &&
    candidate.usernameFragment !== null &&
    typeof candidate.usernameFragment !== "string"
  ) {
    return false;
  }

  return true;
}

export function parseOfferPayload(raw: unknown): WebRtcOfferPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<WebRtcOfferPayload>;
  if (typeof payload.to !== "string" || payload.to.length === 0) {
    return null;
  }

  if (!isSignalingDescription(payload.description)) {
    return null;
  }

  if (payload.description.type !== "offer") {
    return null;
  }

  return {
    to: payload.to,
    description: payload.description,
  };
}

export function parseAnswerPayload(raw: unknown): WebRtcAnswerPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<WebRtcAnswerPayload>;
  if (typeof payload.to !== "string" || payload.to.length === 0) {
    return null;
  }

  if (!isSignalingDescription(payload.description)) {
    return null;
  }

  if (payload.description.type !== "answer") {
    return null;
  }

  return {
    to: payload.to,
    description: payload.description,
  };
}

export function parseIceCandidatePayload(
  raw: unknown,
): WebRtcIceCandidatePayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<WebRtcIceCandidatePayload>;
  if (typeof payload.to !== "string" || payload.to.length === 0) {
    return null;
  }

  if (!isIceCandidate(payload.candidate)) {
    return null;
  }

  return {
    to: payload.to,
    candidate: payload.candidate,
  };
}
