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
 * Get the absolute base URL for the application
 * Always returns an absolute URL with protocol and domain
 */
export function getAbsoluteUrl(path: string = ''): string {
  // Client-side: always use window.location.origin (most reliable)
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    console.log('getAbsoluteUrl (client-side):', `${baseUrl}${path}`);
    return `${baseUrl}${path}`;
  }
  
  // Server-side: try multiple approaches to get the correct URL
  let baseUrl: string;
  
  // 1. Check for VERCEL_URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } 
  // 2. Check for manually set production URL
  else if (process.env.NEXT_PUBLIC_SITE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 3. Production fallback - hardcode your actual domain here
  else if (process.env.NODE_ENV === 'production') {
    // Your actual Vercel domain
    baseUrl = 'https://uwezoo.vercel.app';
  } 
  // 4. Development fallback
  else {
    baseUrl = 'http://localhost:3000';
  }
  
  console.log('getAbsoluteUrl (server-side):', `${baseUrl}${path}`, {
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV
  });
  
  return `${baseUrl}${path}`;
}
