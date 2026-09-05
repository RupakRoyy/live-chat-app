"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/lib/socket";
import type { ChatMessage } from "@/lib/useMessaging";

type ChatPanelProps = {
  matchId?: string | null;
  messages: ChatMessage[];
  canSend: boolean;
  onSend: (text: string) => boolean;
};

export function ChatPanel({
  matchId,
  messages,
  canSend,
  onSend,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft("");
  }, [matchId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [messages]);

  function handleSubmit() {
    const text = draft.trim();
    if (!text || !canSend) {
      return;
    }

    if (onSend(text)) {
      setDraft("");
    }
  }

  return (
    <section
      aria-label="Text chat"
      className="panel-card flex h-full min-h-0 flex-col rounded-2xl"
      data-messaging-enabled="true"
      data-can-send={String(canSend)}
      data-message-count={messages.length}
    >
      <header className="flex items-center justify-between border-b border-border-strong/25 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-charcoal">Chat</h2>
          <p className="text-xs text-charcoal/55">Say hello when you&apos;re ready</p>
        </div>
        <span className="rounded-full bg-chiffon px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-charcoal">
          Live
        </span>
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-chiffon/30 px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-bold text-charcoal">No messages yet</p>
            <p className="max-w-[16rem] text-xs leading-relaxed text-charcoal/55">
              Messages stay in this match only.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.messageId}
              data-message-id={message.messageId}
              data-from-self={String(message.fromSelf)}
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                message.fromSelf
                  ? "ml-auto bg-accent text-on-accent"
                  : "mr-auto bg-snow text-charcoal"
              }`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border-strong/25 p-3">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <input
            id="chat-message"
            name="message"
            type="text"
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={!canSend}
            placeholder={canSend ? "Type a message" : "Messaging unavailable"}
            autoComplete="off"
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border-strong/30 bg-snow px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend || draft.trim().length === 0}
            className="rounded-xl bg-accent px-3.5 py-2.5 text-sm font-bold text-on-accent disabled:opacity-45"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
