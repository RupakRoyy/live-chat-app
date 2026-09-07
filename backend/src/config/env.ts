import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredPositiveNumber(name: string): number {
  const raw = required(name);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid environment variable ${name}: must be a positive number`);
  }
  return value;
}

function optional(name: string): string {
  return process.env[name]?.trim() ?? "";
}

// Determine if we're in production based on common environment indicators
const isProduction = 
  process.env.NODE_ENV === "production" || 
  process.env.RAILWAY_ENVIRONMENT === "production";

function getFrontendUrl(): string {
  const value = process.env.FRONTEND_URL?.trim();
  
  if (value) {
    return value;
  }
  
  // In production, warn but allow localhost (will cause CORS errors)
  if (isProduction) {
    console.warn(
      "WARNING: FRONTEND_URL not set in production. " +
      "CORS will only allow localhost:3000. " +
      "Set FRONTEND_URL to your production frontend URL " +
      "(e.g., https://web-production-1d930.up.railway.app)"
    );
  }
  
  return "http://localhost:3000";
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  frontendUrl: getFrontendUrl(),
  clerkSecretKey: required("CLERK_SECRET_KEY"),
  proTrialDurationHours: requiredPositiveNumber("PRO_TRIAL_DURATION_HOURS"),
  upstashRedisRestUrl: required("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: required("UPSTASH_REDIS_REST_TOKEN"),
  supabaseUrl: optional("SUPABASE_URL"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
};
