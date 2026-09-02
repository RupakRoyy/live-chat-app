type VideoPanelProps = {
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function VideoPanel({
  label,
  variant = "primary",
  className = "",
}: VideoPanelProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-video-stage ${className}`}
    >
      <div
        className={`absolute inset-0 ${
          variant === "primary"
            ? "bg-[radial-gradient(circle_at_30%_20%,rgba(240,236,87,0.12),transparent_45%),linear-gradient(160deg,#353235,#2e2c2f_60%,#242225)]"
            : "bg-[radial-gradient(circle_at_70%_25%,rgba(251,250,198,0.1),transparent_40%),linear-gradient(150deg,#3a383b,#2e2c2f)]"
        }`}
      />

      <div className="relative flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="rounded-full bg-charcoal/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-snow/85">
          {label}
        </span>
        <p className="max-w-[14rem] text-sm text-snow/40">Video placeholder</p>
      </div>
    </div>
  );
}
