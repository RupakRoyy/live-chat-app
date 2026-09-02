/**
 * Public env vars available in the browser.
 * Add SDKs (Clerk, Supabase) in later steps — keys only for now.
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000",
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;
