/**
 * Public env vars available in the browser.
 * Socket.IO shares the Express backend, so the socket URL falls back to the API URL.
 * 
 * IMPORTANT: Next.js bakes these at BUILD TIME. If environment variables are not set
 * during `next build`, localhost fallbacks will be bundled into production.
 * Railway must set these variables in the web service configuration.
 */

const isDevelopment = process.env.NODE_ENV === "development";

// In production builds, require API URL to be explicitly set
// This prevents accidentally bundling localhost URLs into production
function getRequiredUrl(envVar: string, fallback: string, description: string): string {
  const value = process.env[envVar];
  
  if (value) {
    return value;
  }
  
  if (isDevelopment) {
    return fallback;
  }
  
  // Production build without required env var - fail immediately
  throw new Error(
    `${envVar} is required for production builds. ` +
    `Set it to your ${description} (e.g., https://backend-production-8d8f.up.railway.app). ` +
    `This error occurs at build time to prevent bundling localhost URLs into production.`
  );
}

const apiUrl = getRequiredUrl(
  "NEXT_PUBLIC_API_URL",
  "http://localhost:5000",
  "backend URL"
);

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 
    (isDevelopment ? "http://localhost:3000" : ""),
  apiUrl,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? apiUrl,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;
