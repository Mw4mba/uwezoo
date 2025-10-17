# Independent Role 409 Error - Complete Analysis

**Date:** October 17, 2025  
**Error:** 409 Conflict when setting up independent contractor role  
**Symptom:** "Company name already exists" error even for independent contractors

---

## 🔍 Problem Analysis

### The Mysterious 409

When users try to set up an **independent contractor** role, they get a **409 Conflict** error stating "company name already exists" - even though independent contractors shouldn't be creating companies at all!

### Why This Is Confusing

The code logic is correct:
```typescript
// Only create company for employers
if (selectedRole === "employer") {
  // Company creation code...
}
```

But the error happens for **independent** contractors too! This suggests the issue is NOT in our JavaScript code, but likely in the **database layer**.

---

##  🎯 Possible Root Causes

### 1. Database Trigger Creating Companies
There might be a database trigger that automatically creates companies when certain user_profiles fields are set.

**Check with SQL:**
```sql
-- List all triggers on user_profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';
```

### 2. Unique Constraint on user_profiles
The user_profiles table might have a unique constraint that's being violated.

**Check with SQL:**
```sql
-- List all constraints on user_profiles
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass;
```

### 3. Previous Role Switch Causing Conflict
If a user previously selected "employer" and is now switching to "independent", there might be orphaned data.

**Check user's current state:**
```sql
-- Replace 'user-id-here' with actual user ID
SELECT 
    user_id,
    role,
    role_selected,
    company_name,
    company_size,
    industry,
    created_at,
    updated_at
FROM user_profiles
WHERE user_id = 'user-id-here';
```

**Check if user has a company:**
```sql
SELECT 
    id,
    name,
    owner_id,
    industry,
    size_range,
    created_at
FROM companies
WHERE owner_id = 'user-id-here';
```

### 4. RLS (Row Level Security) Policy Blocking Update
Row Level Security policies might be preventing the update.

**Check RLS policies:**
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
```

### 5. Foreign Key Constraint Issue
There might be a foreign key relationship causing the conflict.

**Check foreign keys:**
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'user_profiles';
```

---

## 🛠️ Investigation Steps

### Step 1: Check Current Database State

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check if there are any companies without owners
SELECT COUNT(*) as orphaned_companies
FROM companies
WHERE owner_id IS NULL;

-- 2. Check if there are users with company data but role != 'employer'
SELECT 
    user_id,
    role,
    company_name,
    company_size,
    industry
FROM user_profiles
WHERE role != 'employer'
    AND (company_name IS NOT NULL 
         OR company_size IS NOT NULL 
         OR industry IS NOT NULL);

-- 3. Check for duplicate company names
SELECT 
    name,
    COUNT(*) as count
FROM companies
GROUP BY name
HAVING COUNT(*) > 1;

-- 4. Check user_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

### Step 2: Enhanced Logging Analysis

The enhanced logging now shows:
```javascript
console.log('📝 Role Selection: Updating user profile with role:', selectedRole);
console.log('📤 Role Selection: Profile data being sent:', profileData);
// ... operation happens ...
console.error('❌ Role Selection: Profile update failed:', {
  code: profileError.code,
  message: profileError.message,
  details: profileError.details
});
```

**What to look for in console:**
- Does the log show `selectedRole: "independent"`?
- What is the exact `profileData` being sent?
- What is the `profileError.code`? (Should be `23505` for unique violation)
- What does `profileError.details` say?

---

## ✅ Solutions

### Solution 1: Clear Orphaned Company Data

If users have company data from a previous "employer" selection:

```sql
-- Clear company fields for non-employers
UPDATE user_profiles
SET 
    company_name = NULL,
    company_size = NULL,
    industry = NULL
WHERE role IN ('employee', 'independent')
    AND (company_name IS NOT NULL 
         OR company_size IS NOT NULL 
         OR industry IS NOT NULL);
```

### Solution 2: Fix Unique Constraint

If there's a unique constraint on company_name in user_profiles:

```sql
-- Remove unique constraint if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_company_name_key;
```

### Solution 3: Handle Role Switching in Code

Update the role selection to explicitly clear company data when switching away from employer:

```typescript
const profileData = {
  user_id: user.id,
  role: selectedRole,
  role_selected: true,
  // Explicitly set to null for non-employers
  company_name: selectedRole === "employer" ? companyName : null,
  company_size: selectedRole === "employer" ? companySize : null,
  industry: selectedRole === "employer" ? industry : null,
  updated_at: new Date().toISOString()
};
```

✅ **This is already implemented!**

### Solution 4: Delete Old Company Records

When user switches from employer to non-employer, delete their company:

```typescript
// Add this before profile update
if (selectedRole !== "employer") {
  // Delete any existing company for this user
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('owner_id', user.id);
  
  if (deleteError) {
    console.warn('⚠️ Could not delete old company:', deleteError);
    // Don't throw - continue with role change
  }
}
```

---

## 🔧 Recommended Fix

Add the following to `components/role-selection.tsx` right after the `try {` line:

```typescript
try {
  console.log('📝 Role Selection: Updating user profile with role:', selectedRole);
  
  // If switching away from employer, clean up company data
  if (selectedRole !== "employer") {
    console.log('🧹 Role Selection: Cleaning up company data for non-employer role');
    
    // Delete any existing company
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('owner_id', user.id);
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.warn('⚠️ Could not delete company:', deleteError);
    }
  }
  
  // Continue with profile update...
```

---

## 📊 Debug Checklist

Use this checklist to diagnose the issue:

- [ ] Open browser DevTools Console
- [ ] Clear console logs
- [ ] Attempt to set independent role
- [ ] Check console for error details:
  - [ ] What is `profileError.code`?
  - [ ] What is `profileError.message`?
  - [ ] What is `profileError.details`?
- [ ] Check Network tab:
  - [ ] Which API endpoint failed?
  - [ ] What was the request payload?
  - [ ] What was the response body?
- [ ] Check Supabase Dashboard:
  - [ ] Run SQL queries above
  - [ ] Check for orphaned data
  - [ ] Review table constraints
  - [ ] Check RLS policies

---

## 🎯 Most Likely Cause

Based on the symptoms, the **most likely cause** is:

**A database trigger or constraint that's trying to create/validate company data even for non-employer roles.**

This could be:
1. A trigger on `user_profiles` that fires on UPDATE
2. A foreign key constraint that's being violated
3. A unique constraint on `company_name` in `user_profiles`
4. An RLS policy that's checking company-related fields

---

## 📝 Action Items

1. **Run the SQL queries** in Supabase SQL Editor to check database state
2. **Share the console error details** (code, message, details)
3. **Check if the user previously selected "employer"**
4. **Implement the cleanup code** to delete old companies when switching roles

---

##  💡 Quick Test

To quickly test if it's an old company causing issues:

```sql
-- Delete ALL companies for a test user
DELETE FROM companies WHERE owner_id = 'test-user-id';

-- Clear company fields in profile
UPDATE user_profiles
SET company_name = NULL, company_size = NULL, industry = NULL
WHERE user_id = 'test-user-id';
```

Then try selecting independent role again.

---

**Status:** Enhanced logging added ✅  
**Next Step:** Run SQL queries to identify exact database issue  
**Expected Resolution:** Add cleanup code to handle role switching
