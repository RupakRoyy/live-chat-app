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

export const env = {
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  clerkSecretKey: required("CLERK_SECRET_KEY"),
  proTrialDurationHours: requiredPositiveNumber("PRO_TRIAL_DURATION_HOURS"),
};
