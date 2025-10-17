"use client";

import { createContext, useState, useMemo, useContext, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRole, RoleProvider } from "@/hooks/use-role";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { TaskWithProgress, UserTaskMetadata } from "@/lib/types/database";
import { AnimatePresence, motion } from "framer-motion";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { RoleSelection } from "@/components/role-selection";
import { RoleRedirectSkeleton } from "@/components/loading-skeleton";
import Link from "next/link";

interface DashboardContextType {
  tasks: TaskWithProgress[];
  handleTaskCompletionChange: (taskId: number, completed: boolean, metadata?: UserTaskMetadata) => Promise<void>;
  progressPercentage: number;
  loading: boolean;
  refreshTasks: () => Promise<void>;
  userRole: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProvider>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </RoleProvider>
  );
}

function ProtectedLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🏗️ ProtectedLayout: Component rendering...');
  
  const { user } = useAuth()
  const { role, roleSelected, checkingRole } = useRole()
  const [tasks, setTasks] = useState<TaskWithProgress[]>([])
  const [loading, setLoading] = useState(false)

  const handleRoleSelected = async (selectedRole: string) => {
    // Navigate to role-specific page
    switch (selectedRole) {
      case 'employer':
        window.location.replace('/protected/employer');
        break;
      case 'employee':
        window.location.replace('/protected/employee');
        break;
      case 'independent':
        window.location.replace('/protected/employee'); // Use employee for now
        break;
      default:
        window.location.replace('/protected');
    }
  };

  const refreshTasks = useCallback(async () => {
    console.log('📋 ProtectedLayout: Task refresh starting...');
    const taskRefreshStart = performance.now();
    
    if (!user) {
      console.log('👤 ProtectedLayout: No user for task refresh');
      return;
    }
    
    setLoading(true);
    try {
      console.log('💾 ProtectedLayout: Checking task cache...');
      const cacheCheckStart = performance.now();
      
      // Check cache first to improve performance
      const cacheKey = `tasks_${user.id}`;
      const cachedTasks = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
      
      // Use cached data if it's still fresh
      if (cachedTasks && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
        console.log('✅ ProtectedLayout: Using cached tasks');
        setTasks(JSON.parse(cachedTasks));
        setLoading(false);
        const cacheTime = performance.now();
        console.log(`⏱️ ProtectedLayout: Cache task load took ${(cacheTime - cacheCheckStart).toFixed(2)}ms`);
        return;
      }

      console.log('🔄 ProtectedLayout: Loading default tasks...');
      const defaultTasksStart = performance.now();

      // Default tasks for when database isn't set up yet
      const defaultTasks: TaskWithProgress[] = [
        { id: 1, title: "Review and Sign NDA", description: "Review and sign the Non-Disclosure Agreement", task_type: "nda", is_required: true, order_index: 1, created_at: new Date().toISOString(), completed: false },
        { id: 2, title: "Sign Employment Contract", description: "Review and sign your employment contract", task_type: "contract", is_required: true, order_index: 2, created_at: new Date().toISOString(), completed: false },
        { id: 3, title: "Upload CV for Skill Analysis", description: "Upload your CV for AI-powered skill analysis", task_type: "cv_analysis", is_required: true, order_index: 3, created_at: new Date().toISOString(), completed: false },
        { id: 4, title: "Complete Profile Information", description: "Fill in your complete profile information", task_type: "form", is_required: true, order_index: 4, created_at: new Date().toISOString(), completed: false },
        { id: 5, title: "Take the Aptitude Quiz", description: "Complete the aptitude assessment quiz", task_type: "quiz", is_required: true, order_index: 5, created_at: new Date().toISOString(), completed: false },
        { id: 6, title: "Record a Video Introduction", description: "Record a brief video introduction", task_type: "video_intro", is_required: true, order_index: 6, created_at: new Date().toISOString(), completed: false },
        { id: 7, title: "Meet your onboarding buddy", description: "Connect with your assigned onboarding buddy", task_type: "chat", is_required: true, order_index: 7, created_at: new Date().toISOString(), completed: false },
      ];

      // Load from localStorage with fallback to defaults
      const savedTasks = localStorage.getItem(cacheKey);
      const tasksToSet = savedTasks ? JSON.parse(savedTasks) : defaultTasks;
      
      setTasks(tasksToSet);
      
      // Update cache
      localStorage.setItem(cacheKey, JSON.stringify(tasksToSet));
      localStorage.setItem(`${cacheKey}_timestamp`, now.toString());
      
      const defaultTasksTime = performance.now();
      console.log(`⏱️ ProtectedLayout: Default tasks setup took ${(defaultTasksTime - defaultTasksStart).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ ProtectedLayout: Error loading tasks:', error);
      // Minimal fallback for errors
      setTasks([
        { id: 1, title: "Review and Sign NDA", description: "Review and sign the Non-Disclosure Agreement", task_type: "nda", is_required: true, order_index: 1, created_at: new Date().toISOString(), completed: false },
        { id: 2, title: "Complete Profile Information", description: "Fill in your complete profile information", task_type: "form", is_required: true, order_index: 2, created_at: new Date().toISOString(), completed: false },
      ]);
    } finally {
      setLoading(false);
      const totalTaskTime = performance.now();
      console.log(`⏱️ ProtectedLayout: Total task refresh took ${(totalTaskTime - taskRefreshStart).toFixed(2)}ms`);
    }
  }, [user]);

  const handleTaskCompletionChange = async (taskId: number, completed: boolean, metadata?: UserTaskMetadata) => {
    if (!user) return;

    try {
      // Update local state
      const updatedTasks = tasks.map((task) =>
        task.id === taskId 
          ? { 
              ...task, 
              completed,
              user_task: {
                id: crypto.randomUUID(),
                user_id: user.id,
                task_id: taskId,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
                metadata: metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            } 
          : task
      );

      setTasks(updatedTasks);
      
      // Persist to localStorage for now
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(updatedTasks));

      // TODO: Replace with actual Supabase calls when database is set up
      console.log('Task completion updated:', { taskId, completed, metadata });
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshTasks();
    }
  }, [user, refreshTasks]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const value = {
    tasks,
    handleTaskCompletionChange,
    progressPercentage,
    loading,
    refreshTasks,
    userRole: role, // Use role from context
  };

  // Show role selection if user hasn't selected a role yet
  if (checkingRole) {
    console.log('🔄 ProtectedLayout: Showing role redirect skeleton...');
    return <RoleRedirectSkeleton />;
  }

  if (!roleSelected) {
    console.log('🎭 ProtectedLayout: Showing role selection...');
    return <RoleSelection onRoleSelected={handleRoleSelected} />;
  }

  console.log('✅ ProtectedLayout: Rendering main layout...');
  return (
    <DashboardContext.Provider value={value}>
      <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold">
                <Link href={"/protected"}>Uwezo Career Platform</Link>
              </div>
              <div className="flex items-center gap-4">
                <AuthButton />
                <ThemeSwitcher />
              </div>
            </div>
          </nav>
          <div className="flex-1 flex flex-col gap-8 max-w-7xl p-5 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={children ? (children as React.ReactElement).key : undefined}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
            <p>
              &copy; {new Date().getFullYear()} Uwezo. All rights reserved.
            </p>
            <p>
              Powered by{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                className="font-bold hover:underline"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
          </footer>
        </div>
      </main>
    </DashboardContext.Provider>
  );
}
