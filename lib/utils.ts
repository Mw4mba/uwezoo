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
 * Get the base URL for the application
 * Uses Vercel's automatic environment variable and window.location.origin
 */
export function getBaseUrl(): string {
  // Client-side: use window.location.origin (always correct)
  if (typeof window !== 'undefined') {
    const url = window.location.origin;
    console.log('getBaseUrl (client-side):', url);
    return url;
  }
  
  // Server-side: use Vercel's automatic VERCEL_URL or localhost fallback
  const url = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  console.log('getBaseUrl (server-side):', url);
  return url;
}
