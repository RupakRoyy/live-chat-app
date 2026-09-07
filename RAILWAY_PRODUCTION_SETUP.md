# Railway Production Setup Guide

## Production URLs

- **Frontend**: https://web-production-1d930.up.railway.app
- **Backend**: https://backend-production-8d8f.up.railway.app

## Critical Production Issues Fixed

### 1. Frontend Environment Variable Fallbacks
**Problem**: The frontend code had hardcoded localhost:5000 fallbacks that were being bundled into production builds, causing the deployed app to call localhost instead of the Railway backend.

**Files Changed**:
- `web/src/lib/env.ts` - Now fails at build time if NEXT_PUBLIC_API_URL is not set in production
- `web/.env.example` - Updated with clearer production warnings

### 2. Backend CORS Configuration
**Problem**: The backend CORS was defaulting to localhost:3000, blocking all requests from the production frontend.

**Files Changed**:
- `backend/src/config/env.ts` - Added production warning when FRONTEND_URL is missing
- `backend/.env.example` - Updated with clearer production warnings

## Required Environment Variables

### Frontend (web service on Railway)

**Critical - Build will fail without these:**
```bash
NEXT_PUBLIC_API_URL=https://backend-production-8d8f.up.railway.app
```

**Required for authentication:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Optional but recommended:**
```bash
NEXT_PUBLIC_APP_URL=https://web-production-1d930.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://backend-production-8d8f.up.railway.app
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**If using Supabase:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Backend (backend service on Railway)

**Critical - Server will fail without these:**
```bash
FRONTEND_URL=https://web-production-1d930.up.railway.app
CLERK_SECRET_KEY=sk_test_...
PRO_TRIAL_DURATION_HOURS=24
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Optional (if using Supabase for persistent storage):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Optional:**
```bash
PORT=5000
```
(Railway sets this automatically, but you can override)

## Deployment Checklist

### Before Deploying to Railway:

1. **Set all environment variables in Railway dashboard**
   - Go to your Railway project
   - Select the web service
   - Go to Variables tab
   - Add all required NEXT_PUBLIC_* variables
   - Do the same for the backend service

2. **Verify Clerk configuration**
   - Ensure your Clerk publishable key matches your environment
   - Add your Railway production URLs to Clerk's allowed origins

3. **Update CORS settings**
   - Ensure FRONTEND_URL on backend matches your Railway frontend URL exactly
   - Include https:// in the URL

4. **Test the build locally first**
   ```bash
   # From web/
   npm run build
   
   # From backend/
   npm run build
   npm test
   ```

### After Deploying:

1. **Check backend logs** for the startup message about FRONTEND_URL
2. **Open browser console** on your production frontend to verify:
   - No localhost:5000 or localhost:3000 URLs in network requests
   - No CORS errors
   - API calls are going to https://backend-production-8d8f.up.railway.app

## Common Issues

### "CORS policy has blocked" error
- **Cause**: FRONTEND_URL not set on backend, or set to wrong URL
- **Fix**: Set FRONTEND_URL=https://web-production-1d930.up.railway.app on backend service

### "fetch at localhost:5000" error
- **Cause**: NEXT_PUBLIC_API_URL not set during build
- **Fix**: Set NEXT_PUBLIC_API_URL in Railway before deploying, then redeploy

### Build fails with "NEXT_PUBLIC_API_URL is required"
- **Cause**: This is the intended behavior! The build prevents bundling localhost URLs
- **Fix**: Set NEXT_PUBLIC_API_URL in Railway environment variables

### Socket connection fails
- **Cause**: NEXT_PUBLIC_SOCKET_URL or NEXT_PUBLIC_API_URL not set
- **Fix**: Set both to https://backend-production-8d8f.up.railway.app

## Local Development

For local development, create these files (they are gitignored):

**web/.env.local:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**backend/.env:**
```bash
FRONTEND_URL=http://localhost:3000
CLERK_SECRET_KEY=sk_test_...
PRO_TRIAL_DURATION_HOURS=24
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

The code now properly uses localhost in development and requires production URLs in production builds.

## Files Modified

### Frontend Changes:
1. `web/src/lib/env.ts` - Removed localhost fallback, added build-time validation
2. `web/.env.example` - Updated documentation

### Backend Changes:
1. `backend/src/config/env.ts` - Added production warning for missing FRONTEND_URL
2. `backend/.env.example` - Updated documentation

### No changes to:
- UI components
- Matchmaking logic
- WebRTC logic
- Messaging logic
- Supabase integration
- Database schema
- Secrets or credentials

## Verification

All builds and tests passed:
- ✅ Frontend TypeScript compilation
- ✅ Frontend production build
- ✅ Backend TypeScript compilation
- ✅ Backend production build
- ✅ All 49 backend tests passed

## Next Steps

1. Set environment variables in Railway dashboard
2. Redeploy both frontend and backend services
3. Verify in browser console that all requests go to Railway URLs
4. Test authentication flow
5. Test matchmaking and chat functionality
