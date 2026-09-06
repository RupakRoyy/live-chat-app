-- Additive own-gender column. Safe to run more than once.
-- Does not drop, truncate, or rewrite existing entitlement rows.

ALTER TABLE user_entitlements
  ADD COLUMN IF NOT EXISTS own_gender TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_entitlements_own_gender_check'
  ) THEN
    ALTER TABLE user_entitlements
      ADD CONSTRAINT user_entitlements_own_gender_check
      CHECK (own_gender IS NULL OR own_gender IN ('male', 'female'));
  END IF;
END $$;
