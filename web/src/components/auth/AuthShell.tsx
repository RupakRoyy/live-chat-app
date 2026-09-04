import { BrandMark } from "@/components/BrandMark";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 app-backdrop" />

      <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
        <header className="px-4 py-4 sm:px-6">
          <BrandMark onDark />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-1 sm:px-6">
          <div className="animate-fade-up landing-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
            <div className="text-center">
              <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-snow sm:text-[2.15rem]">
                {title}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {subtitle}
              </p>
            </div>

            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
