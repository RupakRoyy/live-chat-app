# Supabase PostgreSQL Setup for Production

This document explains how to configure Supabase PostgreSQL for production entitlement persistence.

## Overview

The backend uses a dual-store architecture:

- **Development**: Local JSON file store at `backend/data/entitlements.json`
- **Production**: Supabase PostgreSQL with automatic selection based on environment variables

## Database Schema

The entitlement data is stored in a single table:

```sql
CREATE TABLE user_entitlements (
  user_id TEXT PRIMARY KEY,              -- Clerk user ID (unique)
  trial_started_at TIMESTAMPTZ NOT NULL, -- Trial start time (UTC)
  trial_expires_at TIMESTAMPTZ NOT NULL, -- Trial expiry time (UTC)
  own_gender TEXT CHECK (own_gender IS NULL OR own_gender IN ('male', 'female')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the database to initialize

### 2. Run SQL Migrations

In the Supabase SQL Editor, run these migrations in order:

```bash
backend/sql/001_user_entitlements.sql
backend/sql/002_user_own_gender.sql  # Only if 001 was run before own_gender was added
```

**Note**: If you're setting up a fresh database, `001_user_entitlements.sql` already includes the `own_gender` column, so you only need to run that one file.

The migrations are idempotent and safe to re-run.

### 3. Get Credentials

From your Supabase project settings:

1. Go to **Settings** → **API**
2. Copy the **Project URL** (looks like `https://abc123.supabase.co`)
3. Copy the **service_role key** (starts with `eyJ...`)

**Security**: The `service_role` key bypasses Row Level Security and should NEVER be exposed to the frontend.

### 4. Configure Backend Environment

For local development (`backend/.env`):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

For Railway production:

Add these environment variables to your Railway backend service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Verify Configuration

Start the backend and look for this log:

```
Entitlements: using Supabase store
```

If you see this instead, Supabase is not configured:

```
Entitlements: using local file store (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set)
```

## Store Selection Logic

The backend automatically selects the storage layer:

```typescript
if (env.supabaseUrl && env.supabaseServiceRoleKey) {
  // Both variables present → Use Supabase
  console.info("Entitlements: using Supabase store");
  return createSupabaseEntitlementStore(...);
}

// Either variable missing → Use JSON fallback
console.info("Entitlements: using local file store ...");
return fileEntitlementStore;
```

## Error Handling

### Not Configured (Development)

When Supabase env vars are NOT set:
- ✅ JSON file store is used
- ✅ Application works normally
- ✅ Data persists to `backend/data/entitlements.json`

### Configured (Production)

When Supabase env vars ARE set:
- ✅ Supabase store is used
- ❌ Database errors throw and propagate (no silent fallback)
- ✅ This prevents data divergence between stores

## Security

### Row Level Security (RLS)

RLS is enabled on `user_entitlements`:

```sql
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;
```

**No policies are defined** because:
- The backend uses `service_role` key which bypasses RLS
- Anonymous/client requests cannot read or write this table
- All entitlement operations must go through the authenticated backend API

### Never Expose Service Role Key

❌ **DO NOT**:
- Commit service role key to git
- Use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- Send service role key to frontend
- Log service role key in production

✅ **DO**:
- Keep service role key in backend environment only
- Use anon key for client-side Supabase operations (if needed for other features)
- Rotate keys if accidentally exposed

## Data Migration

### Local → Production

**Local test data is NOT automatically migrated.**

If you need to migrate users from `backend/data/entitlements.json` to Supabase:

1. Write a one-time migration script
2. Test on a staging database first
3. Verify data integrity
4. Run against production

**Do not** blindly copy local dev users into production.

### Zero Downtime

The backend will automatically start using Supabase once env vars are configured. No code changes needed.

## Testing

### Unit Tests

```bash
npm test --workspace=backend
```

Tests cover:
- JSON file store operations
- Supabase store operations (mocked)
- Store selection logic
- Error handling
- Race condition safety

### Manual Verification

1. Set Supabase env vars
2. Start backend: `npm run dev --workspace=backend`
3. Sign in with Clerk on frontend
4. Check Supabase dashboard: new row in `user_entitlements`
5. Set own gender via `/profile` endpoint
6. Verify `own_gender` column is updated

## Troubleshooting

### "Entitlements: using local file store" in production

**Problem**: Backend is not using Supabase

**Solution**: Verify both env vars are set in Railway:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### "Failed to load account" errors

**Problem**: Supabase operations are failing

**Check**:
1. Supabase project is active (not paused)
2. Service role key is correct
3. Migrations have been run
4. Backend logs for specific error messages

### Duplicate key errors

**Problem**: Multiple requests creating trial simultaneously

**Status**: Handled automatically by `insertIfAbsent` race detection

## Environment Variables Summary

### Backend (.env)

```bash
# Required for production persistence
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Other required vars (unchanged)
CLERK_SECRET_KEY=...
PRO_TRIAL_DURATION_HOURS=24
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Railway Backend Service

Add these environment variables:

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`

All other env vars should already be configured.
