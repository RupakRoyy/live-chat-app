/**
 * Public env vars available in the browser.
 * Socket.IO shares the Express backend, so the socket URL falls back to the API URL.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? apiUrl,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;
