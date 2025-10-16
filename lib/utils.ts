import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Get the correct base URL for the application
 * Uses environment variable for production, falls back to window.location.origin for client-side
 */
export function getBaseUrl(): string {
  // First priority: explicit site URL from environment
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    // Server-side: use Vercel URL or fallback
    return process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
  }
  
  // Client-side: use window.location.origin
  return window.location.origin;
}
