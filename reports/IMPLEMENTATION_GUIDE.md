# 🚀 COMPLETE IMPLEMENTATION GUIDE: UWEZO CAREER PLATFORM

## 📋 Overview

This guide provides step-by-step instructions to implement the enhanced role-based Uwezo Career Platform with:
- ✅ **Multi-company employer support**
- ✅ **Advanced employee workflows** 
- ✅ **Independent contractor features**
- ✅ **Comprehensive database schema**
- ✅ **Type-safe TypeScript implementation**

---

## 🗄️ STEP 1: DATABASE SCHEMA DEPLOYMENT

### Apply Enhanced Schema
1. **Open Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and execute** the complete `MIGRATION_SCRIPT.sql` file
3. **Verify tables created** using the table view
4. **Test RLS policies** by querying with different user contexts

### Generate Updated Types
```bash
# Generate TypeScript types from your enhanced schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts
```

### Backup Current Schema (Optional)
```sql
-- Before applying changes, backup current schema
pg_dump --schema-only your_db_name > backup_schema.sql
```

---

## 🔧 STEP 2: UPDATE APPLICATION CONFIGURATION

### Update Supabase Client Configuration
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/enhanced-database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Update Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 👥 STEP 3: IMPLEMENT ROLE-BASED AUTHENTICATION

### Enhanced Auth Hook
```typescript
// hooks/use-enhanced-auth.tsx
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserProfileEnhanced } from '@/lib/types/enhanced-database'

export function useEnhancedAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfileEnhanced | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_enhanced')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfileEnhanced>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles_enhanced')
        .upsert({
          user_id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    updateProfile,
    isEmployee: profile?.primary_role === 'employee',
    isEmployer: profile?.primary_role === 'employer',
    isContractor: profile?.primary_role === 'independent',
    hasRole: (role: string) => 
      profile?.primary_role === role || 
      profile?.secondary_roles?.includes(role as any)
  }
}
```

---

## 🏢 STEP 4: IMPLEMENT EMPLOYER MULTI-COMPANY FEATURES

### Company Management Hook
```typescript
// hooks/use-company-management.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Company, CompanyMember } from '@/lib/types/enhanced-database'

export function useCompanyManagement(userId: string) {
  const [companies, setCompanies] = useState<(Company & { role: string })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUserCompanies = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_companies', { user_uuid: userId })

      if (error) throw error

      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (companyData: {
    name: string
    description?: string
    industry?: string
    website?: string
  }) => {
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          ...companyData,
          slug: companyData.name.toLowerCase().replace(/\s+/g, '-')
        }])
        .select()
        .single()

      if (companyError) throw companyError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('company_members')
        .insert([{
          company_id: company.id,
          user_id: userId,
          role: 'owner',
          status: 'active'
        }])

      if (memberError) throw memberError

      await fetchUserCompanies()
      return { data: company, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const inviteMember = async (companyId: string, email: string, role: string) => {
    // Implementation for inviting members
    // This would typically involve sending an email invitation
  }

  useEffect(() => {
    if (userId) {
      fetchUserCompanies()
    }
  }, [userId])

  return {
    companies,
    loading,
    createCompany,
    inviteMember,
    refresh: fetchUserCompanies
  }
}
```

### Employer Dashboard Component
```typescript
// components/dashboards/employer-dashboard.tsx
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'
import { useCompanyManagement } from '@/hooks/use-company-management'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Users, Briefcase, TrendingUp } from 'lucide-react'

export function EmployerDashboard() {
  const { user, profile } = useEnhancedAuth()
  const { companies, createCompany } = useCompanyManagement(user?.id || '')

  if (!user || profile?.primary_role !== 'employer') {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employer Dashboard</h1>
        <Button onClick={() => createCompany({ name: 'New Company' })}>
          Add Company
        </Button>
      </div>

      {/* Company Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        {/* Add more metrics cards */}
      </div>

      {/* Companies List */}
      <div className="grid gap-4">
        {companies.map((company) => (
          <Card key={company.company_id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {company.company_name}
                <span className="text-sm text-muted-foreground">
                  {company.user_role}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">Manage Jobs</Button>
                <Button variant="outline">View Applications</Button>
                <Button variant="outline">Analytics</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 👨‍💼 STEP 5: IMPLEMENT EMPLOYEE FEATURES

### Job Recommendations Hook
```typescript
// hooks/use-job-recommendations.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { JobOpeningEnhanced, Company } from '@/lib/types/enhanced-database'

export function useJobRecommendations(userId: string) {
  const [recommendations, setRecommendations] = useState<
    (JobOpeningEnhanced & { 
      company: Company 
      skill_match_percentage: number
      already_applied: boolean
    })[]
  >([])
  const [loading, setLoading] = useState(true)

  const fetchRecommendations = async () => {
    try {
      // Use the recommendation query from ROLE_BASED_QUERIES.md
      const { data, error } = await supabase
        .rpc('get_job_recommendations', { user_id: userId })

      if (error) throw error

      setRecommendations(data || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchRecommendations()
    }
  }, [userId])

  return {
    recommendations,
    loading,
    refresh: fetchRecommendations
  }
}
```

### Employee Dashboard Component
```typescript
// components/dashboards/employee-dashboard.tsx
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'
import { useJobRecommendations } from '@/hooks/use-job-recommendations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function EmployeeDashboard() {
  const { user, profile } = useEnhancedAuth()
  const { recommendations } = useJobRecommendations(user?.id || '')

  if (!user || profile?.primary_role !== 'employee') {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Employee Dashboard</h1>

      {/* Job Recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recommended Jobs</h2>
        <div className="grid gap-4">
          {recommendations.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {job.title}
                  <Badge variant="secondary">
                    {job.skill_match_percentage}% match
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.company.name} • {job.location}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{job.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {job.required_skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 STEP 6: IMPLEMENT INDEPENDENT CONTRACTOR FEATURES

### Contractor Management Hook
```typescript
// hooks/use-contractor-management.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ProjectProposal, ClientContract } from '@/lib/types/enhanced-database'

export function useContractorManagement(userId: string) {
  const [proposals, setProposals] = useState<ProjectProposal[]>([])
  const [contracts, setContracts] = useState<ClientContract[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContractorData = async () => {
    try {
      // Fetch proposals
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('project_proposals')
        .select(`
          *,
          client_profile:user_profiles_enhanced!client_id(*),
          company:companies(*)
        `)
        .eq('contractor_id', userId)
        .order('created_at', { ascending: false })

      if (proposalsError) throw proposalsError

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('client_contracts')
        .select(`
          *,
          proposal:project_proposals(*)
        `)
        .eq('contractor_id', userId)
        .order('created_at', { ascending: false })

      if (contractsError) throw contractsError

      setProposals(proposalsData || [])
      setContracts(contractsData || [])
    } catch (error) {
      console.error('Error fetching contractor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProposal = async (proposalData: Partial<ProjectProposal>) => {
    try {
      const { data, error } = await supabase
        .from('project_proposals')
        .insert([{
          contractor_id: userId,
          ...proposalData
        }])
        .select()
        .single()

      if (error) throw error

      await fetchContractorData()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  useEffect(() => {
    if (userId) {
      fetchContractorData()
    }
  }, [userId])

  return {
    proposals,
    contracts,
    loading,
    createProposal,
    refresh: fetchContractorData
  }
}
```

---

## 🔒 STEP 7: IMPLEMENT SECURITY AND PERMISSIONS

### Role-Based Route Protection
```typescript
// components/auth/role-guard.tsx
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'
import { UserRole } from '@/lib/types/enhanced-database'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { profile, loading } = useEnhancedAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!profile || !allowedRoles.includes(profile.primary_role)) {
    return fallback || <div>Access denied</div>
  }

  return <>{children}</>
}
```

### Company Permission Checker
```typescript
// hooks/use-company-permissions.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useCompanyPermissions(userId: string, companyId: string) {
  const [permissions, setPermissions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('company_members')
          .select('role, permissions')
          .eq('user_id', userId)
          .eq('company_id', companyId)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') throw error

        setPermissions(data)
      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId && companyId) {
      checkPermissions()
    }
  }, [userId, companyId])

  const hasPermission = (permission: string) => {
    return permissions?.permissions?.[permission] === true
  }

  const hasRole = (role: string) => {
    return permissions?.role === role
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasRole,
    canCreateJobs: hasPermission('can_create_jobs'),
    canManageApplications: hasPermission('can_manage_applications'),
    canInviteMembers: hasPermission('can_invite_members')
  }
}
```

---

## 📊 STEP 8: IMPLEMENT ANALYTICS AND REPORTING

### Analytics Dashboard Component
```typescript
// components/analytics/analytics-dashboard.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnalyticsDashboard({ companyId }: { companyId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Use analytics queries from ROLE_BASED_QUERIES.md
        const { data, error } = await supabase
          .rpc('get_company_analytics', { company_id: companyId })

        if (error) throw error

        setAnalytics(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [companyId])

  if (loading) return <div>Loading analytics...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.total_applications || 0}
          </div>
        </CardContent>
      </Card>
      {/* Add more analytics cards */}
    </div>
  )
}
```

---

## 🧪 STEP 9: TESTING STRATEGY

### Unit Tests
```typescript
// __tests__/hooks/use-enhanced-auth.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useEnhancedAuth } from '@/hooks/use-enhanced-auth'

describe('useEnhancedAuth', () => {
  it('should return user and profile data', async () => {
    const { result } = renderHook(() => useEnhancedAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Add assertions
  })
})
```

### Integration Tests
```typescript
// __tests__/integration/role-based-access.test.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/enhanced-database'

describe('Role-based access', () => {
  let supabase: ReturnType<typeof createClient<Database>>

  beforeEach(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  })

  it('should allow employers to create jobs', async () => {
    // Test implementation
  })

  it('should prevent unauthorized access', async () => {
    // Test implementation
  })
})
```

---

## 🚀 STEP 10: DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All database migrations applied successfully
- [ ] RLS policies tested and verified
- [ ] TypeScript types updated and compiled without errors
- [ ] All role-based components implemented
- [ ] Security tests passed
- [ ] Performance optimization completed

### Production Deployment
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Monitoring and logging setup
- [ ] Error tracking implemented
- [ ] Performance monitoring enabled

### Post-Deployment Verification
- [ ] All user roles function correctly
- [ ] Multi-company features work as expected
- [ ] Independent contractor workflows operational
- [ ] Analytics and reporting functional
- [ ] Security measures verified

---

## 📞 SUPPORT AND MAINTENANCE

### Common Issues and Solutions

1. **RLS Policy Errors**
   - Verify user context in policies
   - Check policy syntax and logic
   - Test with different user roles

2. **Type Errors**
   - Regenerate types after schema changes
   - Update import statements
   - Check for breaking changes

3. **Performance Issues**
   - Review and optimize database queries
   - Add appropriate indexes
   - Implement caching strategies

### Monitoring
- Set up database performance monitoring
- Track user role distribution
- Monitor application errors and performance
- Regular security audits

---

## 🎯 NEXT STEPS

1. **Enhanced Features**
   - Video interview scheduling
   - AI-powered candidate matching
   - Advanced reporting dashboard
   - Mobile app development

2. **Integrations**
   - Third-party job boards
   - Calendar systems
   - Payment processing
   - Communication tools

3. **Scalability**
   - Database optimization
   - Caching strategies
   - CDN implementation
   - Load balancing

This implementation guide provides a complete roadmap for deploying your enhanced Uwezo Career Platform with all role-based features and multi-company support! 🚀