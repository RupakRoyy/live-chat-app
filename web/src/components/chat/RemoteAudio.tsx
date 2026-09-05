"use client";

import { useEffect, useRef } from "react";

type RemoteAudioProps = {
  stream: MediaStream | null;
};

export function RemoteAudio({ stream }: RemoteAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.srcObject = stream;
    if (stream) {
      void audio.play().catch(() => {
        // Autoplay can be blocked until a user gesture; the element stays ready.
      });
    }

    return () => {
      audio.srcObject = null;
    };
  }, [stream]);

  if (!stream) {
    return null;
  }

  return <audio ref={audioRef} autoPlay playsInline className="sr-only" />;
}
