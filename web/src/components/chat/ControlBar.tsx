"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ChatMode } from "@/components/flow/types";

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      {muted ? (
        <>
          <path
            d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.5V5a3 3 0 0 0-5.76-1.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5 11a7 7 0 0 0 11.5 5.4M19 11v1M12 18v3M8 21h8M4 4l16 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect
            x="9"
            y="3"
            width="6"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      {off ? (
        <>
          <path
            d="M3 7.5A2.5 2.5 0 0 1 5.5 5H12M21 16.5V9l-4 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 3l18 18M5.5 19H16a2.5 2.5 0 0 0 2.5-2.5v-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect
            x="3"
            y="6"
            width="13"
            height="12"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M16 10.5 21 8v8l-5-2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

type ControlBarProps = {
  mode: ChatMode;
  onNext: () => void;
  onEnd: () => void;
  onPartnerLeft: () => void;
};

export function ControlBar({
  mode,
  onNext,
  onEnd,
  onPartnerLeft,
}: ControlBarProps) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [reported, setReported] = useState(false);
  const showCamera = mode === "video";
  const showMic = mode !== "text";

  return (
    <div className="space-y-3">
      <div className="panel-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {showMic ? (
            <Button
              variant={micOn ? "secondary" : "ghost"}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              aria-pressed={!micOn}
              onClick={() => setMicOn((value) => !value)}
              className="min-w-10 px-3 text-charcoal"
            >
              <MicIcon muted={!micOn} />
              <span className="hidden sm:inline">{micOn ? "Mic" : "Muted"}</span>
            </Button>
          ) : null}

          {showCamera ? (
            <Button
              variant={cameraOn ? "secondary" : "ghost"}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              aria-pressed={!cameraOn}
              onClick={() => setCameraOn((value) => !value)}
              className="min-w-10 px-3 text-charcoal"
            >
              <CameraIcon off={!cameraOn} />
              <span className="hidden sm:inline">
                {cameraOn ? "Camera" : "Camera off"}
              </span>
            </Button>
          ) : null}

          <Button
            variant="soft"
            className="text-xs"
            onClick={() => setReported(true)}
            disabled={reported}
          >
            {reported ? "Reported" : "Report"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" className="min-w-[5.5rem]" onClick={onNext}>
            Next
          </Button>
          <Button variant="danger" onClick={onEnd}>
            End
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          className="text-xs text-muted underline-offset-2 hover:text-snow hover:underline"
          onClick={onPartnerLeft}
        >
          Preview: partner disconnected
        </button>
      </div>
    </div>
  );
}
