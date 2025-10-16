# Authentication Redirect Fixes

## Problem
Authentication redirects were hardcoded to `localhost:3000` and `window.location.origin`, causing failures in production where users would be redirected to localhost instead of the proper Vercel domain.

## Solution
Created a centralized `getBaseUrl()` utility function that properly handles URLs across different environments:

### 1. Created getBaseUrl() Utility (`lib/utils.ts`)
```typescript
export function getBaseUrl(): string {
  // Server-side: use environment variables
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  }
  
  // Client-side: use window.location.origin
  return window.location.origin;
}
```

### 2. Environment Variables Added
- Added `NEXT_PUBLIC_SITE_URL` to `.env.example` and `.env.local`
- This variable should be set to your production domain in Vercel settings

### 3. Files Updated

#### Authentication Components:
- **`hooks/use-auth.tsx`**: Updated Google OAuth redirects to use `getBaseUrl()`
- **`components/sign-up-form.tsx`**: Updated email confirmation redirects 
- **`components/forgot-password-form.tsx`**: Updated password reset redirects

#### Application Components:
- **`app/protected/employer/page.tsx`**: Updated application link generation
- **`app/protected/employer/create/page.tsx`**: Updated job creation URLs
- **`components/idea-card.tsx`**: Updated share functionality URLs

#### Layout & Metadata:
- **`app/layout.tsx`**: Updated metadata base URL and app title

## Environment Setup Required

### Development (.env.local)
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel)
Set the following environment variable in your Vercel dashboard:
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## Testing
✅ Build completed successfully with `npm run build`
✅ All TypeScript compilation errors resolved
✅ Authentication flow components updated
✅ URL generation centralized and consistent

## Next Steps
1. Deploy to Vercel with the `NEXT_PUBLIC_SITE_URL` environment variable set
2. Test authentication flows in production
3. Verify that redirects point to the correct domain instead of localhost

## Files Modified
- `lib/utils.ts` (added getBaseUrl function)
- `hooks/use-auth.tsx`
- `components/sign-up-form.tsx`
- `components/forgot-password-form.tsx`
- `app/protected/employer/page.tsx`
- `app/protected/employer/create/page.tsx`
- `components/idea-card.tsx`
- `app/layout.tsx`
- `.env.example`
- `.env.local`