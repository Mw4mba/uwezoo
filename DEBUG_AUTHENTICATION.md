# 🔧 Authentication Redirect Debug Guide

## Current Changes Made ✅

### 1. Direct URL Resolution
All authentication components now use `window.location.origin` directly instead of a utility function:

```typescript
// OAuth redirect (Google sign-in)
const redirectUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/protected`
  : '/protected';

// Email confirmation redirect  
const redirectUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/protected`
  : '/protected';

// Password reset redirect
const redirectUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/update-password`
  : '/auth/update-password';
```

### 2. Added Debug Logging
Console logs will show the actual URLs being used for redirects.

## 🚨 Root Cause: Supabase Project Configuration

The localhost redirect issue is likely caused by **hardcoded URLs in your Supabase project settings**. 

### Check Supabase Dashboard Settings:

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Check these settings:**

#### Site URL
```
Should be: https://your-app.vercel.app
NOT: http://localhost:3000
```

#### Redirect URLs
Make sure these are included:
```
https://your-app.vercel.app/protected
https://your-app.vercel.app/auth/update-password
https://your-app.vercel.app/auth/confirm
http://localhost:3000/protected (for development)
http://localhost:3000/auth/update-password (for development)
```

## 🔍 Debug Steps

### 1. Check Browser Console
When testing authentication, check the browser console for:
```
OAuth redirect URL: https://your-domain.vercel.app/protected
Email redirect URL: https://your-domain.vercel.app/protected
Password reset redirect URL: https://your-domain.vercel.app/auth/update-password
```

### 2. Test Local vs Production
- **Local**: Should show `http://localhost:3000`
- **Production**: Should show `https://your-domain.vercel.app`

### 3. Check Network Tab
In browser dev tools, look at the OAuth request to see what `redirectTo` parameter is being sent.

## 🛠️ Quick Fixes

### If Still Getting Localhost Redirects:

1. **Clear Browser Cache**
   - Clear cookies and cached data for your app
   - Google OAuth might be caching old redirect URLs

2. **Update Supabase Settings**
   - Ensure Site URL is set to your production domain
   - Add both localhost and production URLs to redirect allowlist

3. **Check Environment Variables**
   - Verify `VERCEL_URL` is available in production
   - Check Vercel dashboard for environment variables

4. **Test with Incognito/Private Window**
   - This eliminates cached OAuth data

## 🔧 Emergency Fallback

If the issue persists, try this hardcoded production URL for testing:

```typescript
// Temporary fix for testing
const redirectUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-actual-domain.vercel.app/protected'
  : `${window.location.origin}/protected`;
```

## 📱 Testing Checklist

- [ ] Supabase Site URL updated to production domain
- [ ] Redirect URLs include both localhost and production
- [ ] Browser console shows correct redirect URLs
- [ ] Test in incognito window
- [ ] Clear browser cache
- [ ] Check Vercel environment variables
- [ ] Test OAuth flow end-to-end

The console logs added to the authentication functions will help identify exactly what URLs are being used during the redirect process.