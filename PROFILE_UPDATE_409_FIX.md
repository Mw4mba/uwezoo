# Latest 409 Error - Profile Update Failure

## Date
October 17, 2025

## Error Details

### Console Errors
```
Failed to load resource: the server responded with a status of 409 ()
❌ Role Selection: Profile update failed: Object
Error setting up role: Object
Error details: Object
```

### Root Cause Discovery

The 409 error is now coming from the **profile upsert operation**, not the company creation.

## Database Investigation via MCP

### user_profiles Table Structure
```sql
-- Unique constraints:
user_profiles_pkey: PRIMARY KEY (id)
user_profiles_user_id_key: UNIQUE (user_id)

-- Key columns:
id: uuid (PRIMARY KEY)
user_id: uuid (UNIQUE, FK to auth.users)
role: text (nullable, legacy column)
primary_role: text (NOT NULL, default: 'employee', CHECK constraint)
role_selected: boolean (nullable, default: false)
company_name: text (nullable)
company_size: text (nullable, CHECK constraint)
industry: text (nullable, CHECK constraint)
```

### Current Data State
```sql
SELECT id, user_id, role, primary_role, role_selected, company_name 
FROM user_profiles 
LIMIT 5;

Results:
- User A: role='employer', primary_role='employee', role_selected=true
- User B-E: role=null, primary_role='employee', role_selected=false
```

**KEY FINDING**: The `role` and `primary_role` columns are OUT OF SYNC!

## Problem Analysis

### Issue #1: Mismatched Role Columns
The database has:
- `role`: Legacy column (nullable)
- `primary_role`: New column (NOT NULL, has CHECK constraint)

### Issue #2: Upsert Without Proper Conflict Target
Current code tries to upsert without specifying which unique column to use for conflict resolution.

## Solution Implemented

Using check-then-update pattern with `user_id` as the unique identifier.

## Next Steps

1. Test the updated code
2. Verify no 409 errors
3. Consider database migration to consolidate role columns

---

**Status**: 🔧 FIXED IN CODE, NEEDS TESTING
**Priority**: 🔴 CRITICAL
