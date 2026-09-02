export function ConnectIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto h-28 w-full max-w-[16rem] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 300 120" className="animate-float-y h-full w-full">
        {/* Left person */}
        <circle cx="70" cy="38" r="18" fill="#F0EC57" stroke="#2E2C2F" strokeWidth="3" />
        <path
          d="M42 88c6-18 18-26 28-26s22 8 28 26"
          fill="#FBFAC6"
          stroke="#2E2C2F"
          strokeWidth="3"
        />

        {/* Connection arc */}
        <path
          d="M108 58 C150 28, 150 28, 192 58"
          fill="none"
          stroke="#F0EC57"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />
        <circle cx="150" cy="42" r="6" fill="#FFFAFD" stroke="#2E2C2F" strokeWidth="2" />

        {/* Right person */}
        <circle cx="230" cy="38" r="18" fill="#FFFAFD" stroke="#2E2C2F" strokeWidth="3" />
        <path
          d="M202 88c6-18 18-26 28-26s22 8 28 26"
          fill="#F0EC57"
          stroke="#2E2C2F"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}
