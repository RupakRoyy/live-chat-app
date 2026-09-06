-- Additive entitlement schema. Safe to run more than once.
-- Does not drop, truncate, or alter existing tables.

CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id TEXT PRIMARY KEY,
  trial_started_at TIMESTAMPTZ NOT NULL,
  trial_expires_at TIMESTAMPTZ NOT NULL,
  own_gender TEXT CHECK (own_gender IS NULL OR own_gender IN ('male', 'female')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_entitlements_trial_expires_at_idx
  ON user_entitlements (trial_expires_at);

ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: browser/anon clients cannot read or write this table.
-- The Express backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
