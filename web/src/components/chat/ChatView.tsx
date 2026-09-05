import { ChatPanel } from "@/components/chat/ChatPanel";
import { ControlBar } from "@/components/chat/ControlBar";
import { RemoteAudio } from "@/components/chat/RemoteAudio";
import { VideoPanel } from "@/components/chat/VideoPanel";
import type { ChatMode } from "@/components/flow/types";
import type { ChatMessage } from "@/lib/useMessaging";

type ChatViewProps = {
  mode: ChatMode;
  matchId?: string | null;
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
  messages?: ChatMessage[];
  canSend?: boolean;
  onSendMessage?: (text: string) => boolean;
};

export function ChatView({
  mode,
  matchId = null,
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
  messages = [],
  canSend = false,
  onSendMessage,
}: ChatViewProps) {
  const showVideo = mode === "video";
  const showMessaging = mode === "text" || mode === "video";

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-6 sm:px-6">
      <span
        className="sr-only"
        data-webrtc-state={connectionState ?? "idle"}
        data-local-audio={String(localStream?.getAudioTracks().length ?? 0)}
        data-remote-audio={String(remoteStream?.getAudioTracks().length ?? 0)}
        data-local-video={String(localStream?.getVideoTracks().length ?? 0)}
        data-remote-video={String(remoteStream?.getVideoTracks().length ?? 0)}
        data-messaging={String(showMessaging)}
      >
        {connectionState ?? "idle"}
      </span>
      {mode === "voice" ? <RemoteAudio stream={remoteStream} /> : null}

      <div
        className={
          showVideo && showMessaging
            ? "grid min-h-0 flex-1 grid-rows-[minmax(16rem,1fr)_minmax(10rem,13rem)] gap-4 lg:grid-rows-none lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.9fr)]"
            : showMessaging
              ? "grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.9fr)]"
              : "grid min-h-0 flex-1"
        }
      >
        {showVideo ? (
          <section
            aria-label="Video stage"
            className="grid h-full min-h-0 grid-rows-2 gap-px overflow-hidden rounded-2xl bg-snow/20"
          >
            <VideoPanel
              label="Stranger"
              variant="primary"
              className="min-h-0"
              stream={remoteStream}
            />
            <VideoPanel
              label="You"
              variant="secondary"
              className="min-h-0"
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
                : "Use the chat panel to send a message."}
            </p>
          </section>
        )}

        {showMessaging ? (
          <div className={showVideo ? "min-h-0" : "min-h-[16rem] lg:min-h-0"}>
            <ChatPanel
              matchId={matchId}
              messages={messages}
              canSend={canSend}
              onSend={onSendMessage ?? (() => false)}
            />
          </div>
        ) : null}
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
