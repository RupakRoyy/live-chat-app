"use client";

import { useEffect, useRef } from "react";

type VideoPanelProps = {
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
  stream?: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
};

export function VideoPanel({
  label,
  variant = "primary",
  className = "",
  stream = null,
  muted = false,
  mirrored = false,
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasLiveVideo = Boolean(
    stream?.getVideoTracks().some((track) => track.readyState !== "ended"),
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.srcObject = stream ?? null;
    if (stream) {
      void video.play().catch(() => {
        // Autoplay can be blocked until a user gesture; the element stays ready.
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div
      className={`relative min-h-0 overflow-hidden bg-video-stage ${className}`}
    >
      <div
        className={`absolute inset-0 ${
          variant === "primary"
            ? "bg-[radial-gradient(circle_at_30%_20%,rgba(240,236,87,0.12),transparent_45%),linear-gradient(160deg,#353235,#2e2c2f_60%,#242225)]"
            : "bg-[radial-gradient(circle_at_70%_25%,rgba(251,250,198,0.1),transparent_40%),linear-gradient(150deg,#3a383b,#2e2c2f)]"
        }`}
      />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`absolute inset-0 h-full w-full object-cover ${
          hasLiveVideo ? "opacity-100" : "opacity-0"
        } ${mirrored ? "-scale-x-100" : ""}`}
      />

      <div className="relative flex h-full min-h-0 flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="rounded-full bg-charcoal/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-snow/85">
          {label}
        </span>
        {hasLiveVideo ? null : (
          <p className="max-w-[14rem] text-sm text-snow/40">Video placeholder</p>
        )}
      </div>
    </div>
  );
}
