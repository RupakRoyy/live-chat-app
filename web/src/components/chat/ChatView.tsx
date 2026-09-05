import { ChatPanel } from "@/components/chat/ChatPanel";
import { ControlBar } from "@/components/chat/ControlBar";
import { RemoteAudio } from "@/components/chat/RemoteAudio";
import { VideoPanel } from "@/components/chat/VideoPanel";
import type { ChatMode } from "@/components/flow/types";

type ChatViewProps = {
  mode: ChatMode;
  onNext: () => void;
  onEnd: () => void;
  onPartnerLeft: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  connectionState?: string;
  micOn?: boolean;
  cameraOn?: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
};

export function ChatView({
  mode,
  onNext,
  onEnd,
  onPartnerLeft,
  localStream = null,
  remoteStream = null,
  connectionState,
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
}: ChatViewProps) {
  const showVideo = mode === "video";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-6 sm:px-6">
      <span
        className="sr-only"
        data-webrtc-state={connectionState ?? "idle"}
        data-local-audio={String(localStream?.getAudioTracks().length ?? 0)}
        data-remote-audio={String(remoteStream?.getAudioTracks().length ?? 0)}
        data-local-video={String(localStream?.getVideoTracks().length ?? 0)}
        data-remote-video={String(remoteStream?.getVideoTracks().length ?? 0)}
      >
        {connectionState ?? "idle"}
      </span>
      {mode === "voice" ? <RemoteAudio stream={remoteStream} /> : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.9fr)]">
        {showVideo ? (
          <section
            aria-label="Video stage"
            className="relative min-h-[22rem] overflow-hidden rounded-2xl sm:min-h-[28rem] lg:min-h-0"
          >
            <VideoPanel
              label="Stranger"
              variant="primary"
              className="absolute inset-0"
              stream={remoteStream}
            />
            <VideoPanel
              label="You"
              variant="secondary"
              className="absolute bottom-3 right-3 z-10 aspect-video w-[36%] max-w-[11.5rem] border-[3px] border-accent shadow-[0_12px_28px_-12px_rgba(0,0,0,0.5)] sm:bottom-4 sm:right-4 sm:max-w-[13.5rem]"
              stream={localStream}
              muted
              mirrored
            />
          </section>
        ) : (
          <section className="panel-card flex min-h-[16rem] flex-col items-center justify-center rounded-2xl bg-chiffon/40 p-8 text-center lg:min-h-0">
            <p className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-on-accent">
              {mode === "voice" ? "Voice chat" : "Text chat"}
            </p>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-charcoal">
              You&apos;re connected
            </h2>
            <p className="mt-2 max-w-sm text-sm text-charcoal/65">
              {mode === "voice"
                ? "Mic controls are ready below. Real audio arrives later."
                : "Use the chat panel for the text layout. Messaging arrives later."}
            </p>
          </section>
        )}

        <div className="min-h-[16rem] lg:min-h-0">
          <ChatPanel />
        </div>
      </div>

      <ControlBar
        mode={mode}
        onNext={onNext}
        onEnd={onEnd}
        onPartnerLeft={onPartnerLeft}
        micOn={micOn}
        cameraOn={cameraOn}
        onToggleMic={onToggleMic}
        onToggleCamera={onToggleCamera}
      />
    </div>
  );
}
