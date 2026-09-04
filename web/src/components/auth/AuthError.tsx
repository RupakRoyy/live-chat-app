export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-sm font-medium text-accent"
    >
      {message}
    </p>
  );
}
