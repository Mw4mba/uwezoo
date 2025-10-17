# Database Constraints Analysis

## Date
January 2025

## Overview
Comprehensive analysis of Supabase database constraints affecting role selection functionality, particularly the 409 Conflict errors for independent contractors.

---

## Key Findings

### 1. User Profiles Table Constraints

#### Unique Constraints
- ✅ `user_profiles_user_id_key`: UNIQUE constraint on `user_id`
  - **Impact**: Each user can only have ONE profile
  - **Status**: Working as expected

#### Check Constraints
- `primary_role_check`: Must be 'employee', 'employer', or 'independent'
- `availability_status_check`: Must be 'available', 'employed', 'busy', or 'not_looking'
- `company_size_check`: Must be '1-10', '11-50', '51-200', '201-1000', or '1000+'
- `industry_check`: Must be one of 15 predefined industries

#### Foreign Key Constraints
- `user_profiles_user_id_fkey`: References `auth.users(id)` ON DELETE CASCADE
  - **Impact**: Profile deleted when user deleted

#### Triggers
- `set_updated_at_user_profiles`: Auto-updates `updated_at` timestamp
- Foreign key integrity triggers (automatic)

---

### 2. Companies Table Constraints

#### Unique Constraints
- ⚠️ **CRITICAL**: `companies_slug_key`: UNIQUE constraint on `slug`
  - **Impact**: Two companies cannot have the same slug
  - **Current Issue**: Slug generation may create duplicates
  - **Status**: ⚠️ NEEDS ATTENTION

#### Check Constraints
- `company_size_check`: Must be '1-10', '11-50', '51-200', '201-1000', '1000+', 'startup', or 'enterprise'
- `business_type_check`: Must be 'corporation', 'llc', 'partnership', 'sole_proprietorship', 'nonprofit', 'startup', or 'government'
- `status_check`: Must be 'active', 'inactive', 'suspended', or 'pending_verification'
- `subscription_tier_check`: Must be 'free', 'basic', 'professional', or 'enterprise'
- `verification_level_check`: Must be 'basic', 'verified', 'premium', or 'enterprise'
- `size_range_check`: Must be '1-10', '11-50', '51-200', '201-1000', or '1000+'

#### Foreign Key Constraints
- `companies_owner_id_fkey`: References `auth.users(id)`
  - **Impact**: Company must have valid owner
  - **Status**: NO CASCADE DELETE - orphaned companies possible

#### Triggers
- `set_updated_at_companies`: Auto-updates `updated_at` timestamp
- Multiple cascade delete triggers for related tables
- Foreign key integrity triggers (automatic)

---

## Database Schema Columns

### User Profiles Table (52 columns)
Key columns for role selection:
- `id` (uuid, primary key)
- `user_id` (uuid, unique, FK to auth.users)
- `primary_role` (text, default: 'employee', check constraint)
- `secondary_roles` (text[], nullable)
- `role_selected` (boolean, default: false)
- `role_selected_at` (timestamptz, nullable)
- `role_verified` (boolean, default: false)
- `onboarding_completed` (boolean, default: false)
- `company_name` (text, nullable) - **Legacy field**
- `company_size` (text, nullable, check constraint)
- `industry` (text, nullable, check constraint)

### Companies Table (51 columns)
Key columns for role selection:
- `id` (uuid, primary key)
- `name` (text, required)
- `slug` (text, unique, nullable) - **⚠️ CRITICAL**
- `owner_id` (uuid, FK to auth.users, nullable)
- `company_size` (text, check constraint)
- `industry` (text, nullable)
- `status` (text, default: 'active', check constraint)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## Root Cause of 409 Errors

### Scenario: Independent Contractor Role Selection

1. **User selects "Independent Contractor" role**
2. **Code attempts to create company record** (from components/role-selection.tsx)
3. **Possible causes of 409 conflict**:

   #### A. Slug Collision (Most Likely)
   ```typescript
   // If slug is auto-generated from company name
   const slug = companyName.toLowerCase().replace(/\s+/g, '-');
   // "John Doe Consulting" → "john-doe-consulting"
   // Second user: "John Doe Consulting" → CONFLICT!
   ```
   - Companies table has UNIQUE constraint on `slug`
   - If two users try to create companies with same name → same slug → 409

   #### B. Duplicate Company Creation (Current Bug)
   ```typescript
   // Current flow in role-selection.tsx:
   // 1. User switches from employer → independent
   // 2. Old employer company NOT deleted
   // 3. Tries to insert new independent company
   // 4. If slug matches existing → 409
   ```

   #### C. Orphaned Companies (Database State)
   - User previously created company
   - Switched roles but company not deleted (before our fix)
   - Database has orphaned company with that slug
   - New attempt to create same company → 409

---

## Implemented Fixes

### Fix #1: Company Cleanup on Role Switch ✅
**File**: `components/role-selection.tsx`

```typescript
// Delete old company records when switching from employer to non-employer
if (selectedRole !== "employer") {
  console.log("🧹 Cleaning up old company records for non-employer role");
  
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('owner_id', user.id);
    
  if (deleteError) {
    console.error("❌ Error deleting old company:", deleteError);
  } else {
    console.log("✅ Successfully cleaned up old company records");
  }
}
```

**Status**: ✅ Implemented
**Impact**: Prevents accumulation of orphaned companies

### Fix #2: Duplicate Company Handling ✅
**File**: `components/role-selection.tsx`

```typescript
// For employers: Check if company exists, update instead of insert
if (selectedRole === "employer") {
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (existingCompany) {
    // UPDATE existing company
    await supabase
      .from('companies')
      .update({ name, company_size, industry })
      .eq('id', existingCompany.id);
  } else {
    // INSERT new company
    await supabase
      .from('companies')
      .insert({ name, company_size, industry, owner_id: user.id });
  }
}
```

**Status**: ✅ Implemented
**Impact**: Prevents duplicate company creation for employers

---

## Remaining Issues

### Issue #1: Slug Collision for Independent Contractors ⚠️

**Problem**: 
- Independent contractors may use generic company names
- "John Doe Consulting" (user A)
- "John Doe Consulting" (user B)
- Both try to create company → slug collision → 409

**Current Code**:
```typescript
// We insert company directly without checking for slug conflicts
const { error: companyError } = await supabase
  .from('companies')
  .insert([{
    name: companyName,
    owner_id: user.id,
    // slug is likely auto-generated by database
  }]);
```

**Recommended Solutions**:

#### Option A: Make slug generation unique (RECOMMENDED)
```typescript
// Add unique identifier to slug
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(7);
const baseSlug = companyName.toLowerCase().replace(/\s+/g, '-');
const slug = `${baseSlug}-${user.id.substring(0, 8)}`; // Use user ID fragment

const { error: companyError } = await supabase
  .from('companies')
  .insert([{
    name: companyName,
    slug: slug,
    owner_id: user.id,
  }]);
```

#### Option B: Check for existing slug and modify
```typescript
let slug = companyName.toLowerCase().replace(/\s+/g, '-');
let counter = 1;

while (true) {
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();
    
  if (!existing) break; // Slug is unique
  
  slug = `${baseSlug}-${counter}`;
  counter++;
}

const { error: companyError } = await supabase
  .from('companies')
  .insert([{
    name: companyName,
    slug: slug,
    owner_id: user.id,
  }]);
```

#### Option C: Remove slug requirement for independent contractors
```typescript
// Leave slug as null for independent contractors
const { error: companyError } = await supabase
  .from('companies')
  .insert([{
    name: companyName,
    slug: null, // Allow null for independents
    owner_id: user.id,
  }]);
```

---

### Issue #2: No Database Cascade Delete ⚠️

**Problem**: 
- `companies_owner_id_fkey` does NOT have `ON DELETE CASCADE`
- When user is deleted, companies remain orphaned
- This can cause data integrity issues

**Current Constraint**:
```sql
FOREIGN KEY (owner_id) REFERENCES auth.users(id)
-- No ON DELETE CASCADE
```

**Recommended Solution**:
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.companies
DROP CONSTRAINT companies_owner_id_fkey;

ALTER TABLE public.companies
ADD CONSTRAINT companies_owner_id_fkey
FOREIGN KEY (owner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
```

**Impact**: Companies automatically deleted when user deleted

---

### Issue #3: RLS Not Enabled on Companies ⚠️

**Problem**: 
- `companies` table has `rls_enabled: false`
- Any authenticated user can read/write ANY company
- Security vulnerability

**Current State**:
```json
{
  "schema": "public",
  "name": "companies",
  "rls_enabled": false
}
```

**Recommended Solution**:
```sql
-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own companies
CREATE POLICY "Users can read own companies"
ON public.companies
FOR SELECT
USING (auth.uid() = owner_id);

-- Policy: Users can insert their own companies
CREATE POLICY "Users can insert own companies"
ON public.companies
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own companies
CREATE POLICY "Users can update own companies"
ON public.companies
FOR UPDATE
USING (auth.uid() = owner_id);

-- Policy: Users can delete their own companies
CREATE POLICY "Users can delete own companies"
ON public.companies
FOR DELETE
USING (auth.uid() = owner_id);
```

---

## Error Code Reference

### PostgreSQL Error Codes
- `23505`: Unique violation (duplicate key)
- `23503`: Foreign key violation
- `23514`: Check constraint violation

### PostgREST Error Codes
- `PGRST116`: No rows found (404 equivalent)

### HTTP Status Codes
- `409`: Conflict (duplicate resource)
- `404`: Not found
- `422`: Unprocessable entity (validation failed)

---

## Testing Recommendations

### Test Case 1: Independent Contractor with Common Name
1. User A signs up, selects "Independent Contractor"
2. Company name: "ABC Consulting"
3. Submit form → Should succeed
4. User B signs up, selects "Independent Contractor"
5. Company name: "ABC Consulting"
6. Submit form → **Should succeed with unique slug**

### Test Case 2: Role Switching
1. User signs up, selects "Employer"
2. Company name: "Tech Corp", size: "11-50"
3. Submit → Company created
4. User switches to "Independent Contractor"
5. Submit → **Old company should be deleted first**

### Test Case 3: Employer Company Update
1. User signs up, selects "Employer"
2. Company name: "Startup Inc", size: "1-10"
3. Submit → Company created
4. User updates company name to "Startup LLC"
5. Submit → **Should UPDATE, not create duplicate**

---

## SQL Diagnostic Queries

### Check for Duplicate Companies by Owner
```sql
SELECT owner_id, COUNT(*) as company_count
FROM companies
WHERE owner_id IS NOT NULL
GROUP BY owner_id
HAVING COUNT(*) > 1;
```

### Check for Orphaned Companies
```sql
SELECT c.id, c.name, c.owner_id
FROM companies c
LEFT JOIN auth.users u ON c.owner_id = u.id
WHERE u.id IS NULL;
```

### Check for Slug Collisions
```sql
SELECT slug, COUNT(*) as count
FROM companies
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;
```

### Find User's Current Companies
```sql
SELECT c.*, up.primary_role
FROM companies c
JOIN user_profiles up ON c.owner_id = up.user_id
WHERE up.user_id = '<USER_ID>';
```

---

## Recommended Next Steps

1. **Immediate** (Critical)
   - [ ] Implement unique slug generation for independent contractors (Option A)
   - [ ] Test with multiple users creating same company name
   - [ ] Monitor console logs for error patterns

2. **Short-term** (Important)
   - [ ] Add cascade delete to `companies_owner_id_fkey`
   - [ ] Enable RLS on companies table
   - [ ] Add RLS policies for secure access
   - [ ] Clean up orphaned companies in database

3. **Long-term** (Improvements)
   - [ ] Add slug validation endpoint
   - [ ] Add slug suggestion API (if slug taken)
   - [ ] Add company search by slug
   - [ ] Add audit logs for company operations
   - [ ] Add database indexes for performance

---

## Summary

**Key Issues Identified**:
1. ✅ Duplicate company creation → **FIXED**
2. ✅ Orphaned companies on role switch → **FIXED**
3. ⚠️ Slug collision for independent contractors → **NEEDS FIX**
4. ⚠️ No cascade delete on owner FK → **NEEDS MIGRATION**
5. ⚠️ RLS not enabled → **SECURITY ISSUE**

**Immediate Action Required**:
- Implement unique slug generation (see Option A above)
- This will resolve the 409 errors for independent contractors

**Database Migration Required**:
- Add ON DELETE CASCADE to foreign key
- Enable RLS and add policies

**Testing Focus**:
- Multiple users with same company name
- Role switching scenarios
- Company update vs insert logic
