# Independent Role 404 Error - Debugging Guide

**Date:** October 17, 2025  
**Error:** `Failed to load resource: the server responded with a status of 404 (Not Found)`  
**Trigger:** Setting up independent contractor role

---

## 🔍 Understanding the 404 Error

### What is a 404?
A **404 Not Found** error means the browser tried to fetch a resource (page, image, API endpoint) that doesn't exist on the server.

### When Does This Occur?
The error happens when a user selects "Independent Contractor" as their role and submits the form.

---

## 🎯 Current Implementation

### Role Flow for Independent Contractors

```
User selects "independent" 
          ↓
Role saved to database as "independent"
          ↓
handleRoleSelected called with "independent"
          ↓
Redirects to /protected/employee
          ↓
useRole hook reads role as "independent"
          ↓
Page loads successfully (employee dashboard)
```

### Code References

#### 1. Role Selection (components/role-selection.tsx)
```typescript
const roles = [
  { id: "employee", ... },
  { id: "employer", ... },
  { id: "independent", title: "Independent Contractor", ... }
];
```

#### 2. Redirect Logic (app/protected/layout.tsx)
```typescript
const handleRoleSelected = async (selectedRole: string) => {
  switch (selectedRole) {
    case 'employer':
      window.location.replace('/protected/employer');
      break;
    case 'employee':
      window.location.replace('/protected/employee');
      break;
    case 'independent':
      window.location.replace('/protected/employee'); // ⚠️ Uses employee page
      break;
    default:
      window.location.replace('/protected');
  }
};
```

#### 3. Role Hook Redirect (hooks/use-role.tsx)
```typescript
if (profile?.role_selected && profile?.role) {
  // Redirect from /protected to role-specific dashboard
  if (window.location.pathname === '/protected') {
    const targetPath = profile.role === 'employer' 
      ? '/protected/employer' 
      : '/protected/employee'; // ⚠️ Independent goes to employee
    
    router.replace(targetPath);
  }
}
```

---

## 🐛 Possible Causes of 404

### 1. Missing Static Assets
The browser might be trying to load assets that don't exist:
- Favicon during redirect
- Images referenced in the employee page
- Fonts or stylesheets

### 2. Browser Caching
- Old service worker trying to fetch cached routes
- Browser cache pointing to non-existent routes

### 3. Race Condition
- Multiple redirects happening simultaneously
- Database update hasn't completed before redirect
- Role hook checking before profile is fully updated

### 4. Network Request During Transition
- Some component making an API call during page transition
- Supabase request failing
- Image/icon loading failure

---

## ✅ Enhanced Logging Added

I've added comprehensive logging to track the exact flow:

### Log Points Added:

```typescript
console.log('🎯 Role Selection: Starting submission...', { selectedRole, user: !!user });
console.log('📝 Role Selection: Updating user profile with role:', selectedRole);
console.log('✅ Role Selection: Profile updated successfully');
console.log('🏢 Role Selection: Handling employer company creation...');
console.log('🎉 Role Selection: All operations complete, calling onRoleSelected');
```

### How to Debug:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Clear console** (Ctrl+L or click clear icon)
4. **Select Independent Contractor role**
5. **Watch the logs** in this order:
   ```
   🎯 Role Selection: Starting submission...
   📝 Role Selection: Updating user profile...
   ✅ Role Selection: Profile updated successfully
   🎉 Role Selection: All operations complete
   🔀 RoleContext: Redirecting to /protected/employee
   ```

6. **Switch to Network tab** while doing steps 3-4
7. **Look for red (failed) requests**
8. **Click on the failed request** to see:
   - Request URL
   - Request Method
   - Status Code
   - Response

---

## 🔧 Debugging Steps

### Step 1: Check Network Tab
1. Open DevTools → Network tab
2. Check "Preserve log" checkbox
3. Try selecting independent role
4. Look for any request with status 404
5. Note the **Request URL** of the 404

### Step 2: Check Console Logs
Look for these patterns:
```
✅ Good: All role selection logs complete
❌ Bad: Logs stop midway
⚠️ Warning: Error logs appear
```

### Step 3: Check Database
Verify the role was actually saved:
```sql
SELECT user_id, role, role_selected, updated_at 
FROM user_profiles 
WHERE user_id = 'your-user-id';
```

### Step 4: Check Browser Cache
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear cache and try again
3. Or try in incognito/private window

---

## 🎯 Expected vs Actual

### ✅ Expected Behavior:
1. User selects "Independent Contractor"
2. Profile updated with `role: "independent"`
3. Redirects to `/protected/employee`
4. Employee dashboard loads
5. Shows jobs and opportunities

### ❌ If 404 Occurs:
The error is likely **NOT** from the redirect itself, but from:
- A resource the page is trying to load
- An API call being made during transition
- A broken link or image reference

---

## 🛠️ Solutions to Try

### Solution 1: Add Error Boundaries
Wrap the role selection in an error boundary to catch React errors.

### Solution 2: Delay Redirect
Add a small delay before redirect to ensure database is updated:
```typescript
await new Promise(resolve => setTimeout(resolve, 500));
onRoleSelected(selectedRole);
```

### Solution 3: Use Router Instead of window.location
```typescript
// Instead of:
window.location.replace('/protected/employee');

// Use:
router.replace('/protected/employee');
```

### Solution 4: Create Dedicated Independent Page
Create `/app/protected/independent/page.tsx` for independent contractors instead of sharing the employee page.

---

## 📊 Monitoring

### Key Metrics to Watch:
- Success rate of role selection submissions
- Time between role selection and redirect
- Number of 404 errors in production logs
- User reports of stuck on role selection

### Error Tracking:
All errors are now logged with detailed context:
```javascript
console.error('Error details:', {
  code: err.code,
  message: err.message,
  details: err.details,
  hint: err.hint
});
```

---

## 🚀 Next Steps

1. **Test with enhanced logging** and identify the exact 404 source
2. **Check Network tab** to see which resource is returning 404
3. **Consider creating dedicated independent contractor page** if the issue persists
4. **Add error boundary** to gracefully handle transition errors

---

## 📝 Related Files

- `components/role-selection.tsx` - Role selection form (enhanced logging added)
- `app/protected/layout.tsx` - Role redirect handler
- `hooks/use-role.tsx` - Role context provider
- `app/protected/employee/page.tsx` - Shared page for employee/independent

---

## 💡 Quick Diagnosis

**To quickly find the 404 source:**

1. Open Network tab in DevTools
2. Check "Preserve log"
3. Filter by "404" or "Failed"
4. Submit independent role
5. The failed request will show up with:
   - **URL**: What was being requested
   - **Type**: Document, XHR, Img, CSS, JS, etc.
   - **Initiator**: What triggered the request

This will tell us EXACTLY what's causing the 404!

---

**Status:** Enhanced logging added ✅  
**Build:** Successful ✅  
**Action Required:** Test with DevTools open to identify 404 source
