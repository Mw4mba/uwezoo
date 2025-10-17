# Redirect Performance Debugging Guide

## Added Console Logging

I've added comprehensive console logging to debug slow redirect times after login. Here's what each log message means:

### 🔄 Authentication Flow (`hooks/use-auth.tsx`)
- **🔄 Auth Effect: Starting session check...** - Initial authentication check begins
- **⏱️ Auth: Initial session check took Xms** - Time for initial session retrieval
- **📝 Auth: Session data:** - Whether a user session was found
- **🔔 Auth State Change: EVENT** - Authentication state changes (SIGNED_IN, SIGNED_OUT, etc.)
- **✅ Auth: User signed in, checking profile...** - Profile verification after login
- **⏱️ Auth: Profile check took Xms** - Database query time for profile lookup
- **⚠️ Auth: No profile found, creating...** - Profile creation process
- **⏱️ Auth: Profile creation took Xms** - Time to create new profile
- **⏱️ Auth: Total auth state change took Xms** - Complete authentication process time

### 🏗️ Protected Layout (`app/protected/layout.tsx`)
- **🏗️ ProtectedLayout: Component rendering...** - Layout component starts rendering
- **🔐 ProtectedLayout: Auth check starting...** - Authentication verification begins
- **⏱️ ProtectedLayout: Auth check took Xms** - Time before redirect or continuation
- **✅ ProtectedLayout: User authenticated, loading profile...** - User verified, loading profile
- **💾 ProtectedLayout: Using cached profile** - Profile loaded from cache
- **🌐 ProtectedLayout: Fetching profile from database...** - Database fetch for profile
- **⏱️ ProtectedLayout: Database fetch took Xms** - Profile database query time
- **⏱️ ProtectedLayout: Total profile loading took Xms** - Complete profile loading time

### 🎭 Role Management
- **🎭 ProtectedLayout: Role check starting...** - Role verification begins
- **🔍 ProtectedLayout: Checking user role...** - Database query for user role
- **⏱️ ProtectedLayout: Role query took Xms** - Role database query time
- **✅ ProtectedLayout: Role selected: ROLE** - User has selected a role
- **🔀 ProtectedLayout: Redirecting to PATH** - Router redirect happening
- **⏱️ ProtectedLayout: Router redirect took Xms** - Time for Next.js router redirect
- **⚠️ ProtectedLayout: Role not selected yet** - User needs to select role

### 📋 Task Loading
- **📋 ProtectedLayout: Task refresh starting...** - Task loading begins
- **💾 ProtectedLayout: Checking task cache...** - Cache lookup for tasks
- **✅ ProtectedLayout: Using cached tasks** - Tasks loaded from cache
- **⏱️ ProtectedLayout: Cache task load took Xms** - Cache retrieval time
- **🔄 ProtectedLayout: Loading default tasks...** - Default tasks being set up
- **⏱️ ProtectedLayout: Default tasks setup took Xms** - Task setup time
- **⏱️ ProtectedLayout: Total task refresh took Xms** - Complete task loading time

### 🔗 URL Generation (`lib/utils.ts`)
- **🔗 URL Utils: Getting absolute URL for path:** - URL generation starts
- **⏱️ URL Utils: Client URL generation took Xms** - Client-side URL creation time
- **🌐 URL Utils: Client URL result:** - Generated URL on client
- **⏱️ URL Utils: Server URL generation took Xms** - Server-side URL creation time
- **🌐 URL Utils: Server URL result:** - Generated URL on server

### 🎬 Rendering States
- **🔄 ProtectedLayout: Showing loading state...** - Loading spinner displayed
- **🔄 ProtectedLayout: Showing role redirect skeleton...** - Role check in progress
- **🎭 ProtectedLayout: Showing role selection...** - Role selection screen
- **✅ ProtectedLayout: Rendering main layout...** - Main layout rendering

## How to Use This Debug Info

### 1. Open Browser DevTools
- Press F12 or right-click → Inspect
- Go to Console tab
- Clear existing logs

### 2. Test Login Flow
1. Go to login page
2. Sign in with your account
3. Watch console for timing logs
4. Note any delays > 100ms

### 3. Identify Bottlenecks

**Common Issues:**
- **Auth State Change > 500ms**: Database profile creation slow
- **Role Query > 200ms**: Database connection issues
- **Router Redirect > 100ms**: Next.js routing delays
- **Profile Loading > 300ms**: Database query slow
- **Task Loading > 200ms**: Cache miss or default task setup slow

### 4. Expected Performance

**Good Performance:**
- Auth state change: < 200ms
- Profile check: < 100ms
- Role query: < 50ms
- Router redirect: < 50ms
- Total login redirect: < 500ms

**Warning Signs:**
- Any single operation > 1000ms
- Total redirect time > 2000ms
- Multiple database queries for same data
- No cache hits after first load

## Troubleshooting Steps

### If Auth Is Slow (> 500ms)
1. Check if database trigger is working
2. Execute SUPABASE_FIX.sql if not done
3. Verify RLS policies are correct
4. Check network connection to Supabase

### If Role Check Is Slow (> 200ms)
1. Check user_profiles table structure
2. Verify user has profile record
3. Check for database indexing issues
4. Monitor Supabase dashboard for query performance

### If Router Redirect Is Slow (> 100ms)
1. Check for unnecessary re-renders
2. Verify proper use of router.replace() vs router.push()
3. Look for large component tree re-mounting
4. Check for blocking operations in useEffect

### If Cache Isn't Working
1. Check localStorage in DevTools → Application → Local Storage
2. Verify cache timestamps are recent
5. Look for cache key conflicts

## Next Steps

After reviewing the console logs:
1. Identify the slowest operations
2. Focus optimization on biggest bottlenecks
3. Consider implementing loading states for slow operations
4. Add error handling for failed operations

The logs will help pinpoint exactly where the delay is occurring in your login flow.