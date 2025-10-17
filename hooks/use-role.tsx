"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface RoleContextType {
  role: string | null;
  roleSelected: boolean;
  checkingRole: boolean;
  refreshRole: () => Promise<void>;
  setRoleData: (role: string, selected: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [roleSelected, setRoleSelected] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const isCheckingRef = useRef(false);
  const supabase = createClient();

  const refreshRole = useCallback(async () => {
    // Prevent duplicate calls
    if (isCheckingRef.current || !user) {
      console.log('⚠️ RoleContext: Role check already in progress or no user, skipping');
      return;
    }

    isCheckingRef.current = true;
    console.log('🎭 RoleContext: Checking user role...');
    const startTime = performance.now();

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, role_selected')
        .eq('user_id', user.id)
        .maybeSingle();

      const queryTime = performance.now();
      console.log(`⏱️ RoleContext: Role query took ${(queryTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('❌ RoleContext: Error fetching role:', error);
        setCheckingRole(false);
        isCheckingRef.current = false;
        return;
      }

      console.log('📊 RoleContext: Profile data:', profile);

      if (profile?.role_selected && profile?.role) {
        console.log(`✅ RoleContext: Role found: ${profile.role}`);
        setRole(profile.role);
        setRoleSelected(true);

        // Redirect from /protected to role-specific dashboard
        if (typeof window !== 'undefined' && window.location.pathname === '/protected') {
          const targetPath = profile.role === 'employer' 
            ? '/protected/employer' 
            : '/protected/employee';
          
          console.log(`🔀 RoleContext: Redirecting to ${targetPath}`);
          router.replace(targetPath);
        }
      } else {
        console.log('⚠️ RoleContext: Role not selected or undefined');
        setRole(null);
        setRoleSelected(false);

        // Redirect from role-specific pages to role selection
        if (typeof window !== 'undefined' && 
            (window.location.pathname.startsWith('/protected/employee') || 
             window.location.pathname.startsWith('/protected/employer') ||
             window.location.pathname.startsWith('/protected/profile'))) {
          console.log('🔀 RoleContext: Redirecting to role selection');
          router.replace('/protected');
        }
      }
    } catch (error) {
      console.error('❌ RoleContext: Error in role check:', error);
    } finally {
      setCheckingRole(false);
      isCheckingRef.current = false;
      const totalTime = performance.now();
      console.log(`⏱️ RoleContext: Total role check took ${(totalTime - startTime).toFixed(2)}ms`);
    }
  }, [user, router, supabase]);

  // Manual role update (used after role selection)
  const setRoleData = useCallback((newRole: string, selected: boolean) => {
    console.log(`✅ RoleContext: Manually setting role to ${newRole}`);
    setRole(newRole);
    setRoleSelected(selected);
    setCheckingRole(false);
  }, []);

  // Check role when user changes
  useEffect(() => {
    if (user) {
      refreshRole();
    } else {
      setRole(null);
      setRoleSelected(false);
      setCheckingRole(false);
    }
  }, [user, refreshRole]);

  const value: RoleContextType = {
    role,
    roleSelected,
    checkingRole,
    refreshRole,
    setRoleData,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
