import Link from "next/link";

type BrandMarkProps = {
  href?: string | null;
  size?: "sm" | "lg";
  className?: string;
  onDark?: boolean;
};

export function BrandMark({
  href = "/",
  size = "sm",
  className = "",
  onDark = true,
}: BrandMarkProps) {
  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className={`grid place-items-center rounded-2xl bg-accent ${
          size === "lg" ? "h-11 w-11" : "h-9 w-9"
        }`}
      >
        <span
          className={`rounded-md bg-charcoal ${
            size === "lg" ? "h-4 w-4" : "h-3 w-3"
          }`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-bold tracking-tight ${
            onDark ? "text-snow" : "text-charcoal"
          } ${size === "lg" ? "text-2xl sm:text-[1.65rem]" : "text-lg"}`}
        >
          Live Chat
        </span>
        {size === "lg" ? (
          <span
            className={`mt-1 text-xs font-medium ${
              onDark ? "text-muted" : "text-charcoal/60"
            }`}
          >
            Talk to someone new
          </span>
        ) : null}
      </span>
    </span>
  );

  if (href == null) return mark;

  return (
    <Link
      href={href}
      className="inline-flex w-fit rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {mark}
    </Link>
  );
}
