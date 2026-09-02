export function ChatPanel() {
  return (
    <section
      aria-label="Text chat"
      className="panel-card flex h-full min-h-0 flex-col rounded-2xl"
    >
      <header className="flex items-center justify-between border-b border-border-strong/25 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-charcoal">Chat</h2>
          <p className="text-xs text-charcoal/55">Say hello when you&apos;re ready</p>
        </div>
        <span className="rounded-full bg-chiffon px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-charcoal">
          Preview
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 bg-chiffon/30 px-4 py-8 text-center">
        <p className="text-sm font-bold text-charcoal">No messages yet</p>
        <p className="max-w-[16rem] text-xs leading-relaxed text-charcoal/55">
          Messaging connects after matchmaking and sockets are ready.
        </p>
      </div>

      <div className="border-t border-border-strong/25 p-3">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <input
            id="chat-message"
            name="message"
            type="text"
            disabled
            placeholder="Messaging comes later"
            className="min-w-0 flex-1 rounded-xl border border-border-strong/30 bg-snow px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled
            className="rounded-xl bg-accent px-3.5 py-2.5 text-sm font-bold text-on-accent opacity-45"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
