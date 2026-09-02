import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "soft";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[var(--shadow-accent)] hover:bg-accent-hover focus-visible:outline-accent",
  secondary:
    "bg-surface text-charcoal border border-border-strong hover:bg-chiffon focus-visible:outline-accent",
  soft:
    "bg-chiffon text-charcoal hover:bg-accent/40 focus-visible:outline-accent",
  danger:
    "bg-charcoal text-snow border border-border-strong hover:bg-charcoal/90 focus-visible:outline-snow",
  ghost:
    "bg-transparent text-muted hover:bg-white/5 hover:text-snow focus-visible:outline-accent",
};

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  onClick,
  ...aria
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${className}`}
      {...aria}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
