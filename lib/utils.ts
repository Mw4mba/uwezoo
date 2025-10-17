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
export function getAbsoluteUrl(path?: string): string {
  console.log('🔗 URL Utils: Getting absolute URL for path:', path);
  const urlStart = performance.now();
  
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    const clientUrl = new URL(path || '', window.location.origin).toString();
    const clientTime = performance.now();
    console.log(`⏱️ URL Utils: Client URL generation took ${(clientTime - urlStart).toFixed(2)}ms`);
    console.log('🌐 URL Utils: Client URL result:', clientUrl);
    return clientUrl;
  }

  // Server-side URL generation
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://uwezoo.vercel.app';
  
  const serverUrl = new URL(path || '', baseUrl).toString();
  const serverTime = performance.now();
  console.log(`⏱️ URL Utils: Server URL generation took ${(serverTime - urlStart).toFixed(2)}ms`);
  console.log('🌐 URL Utils: Server URL result:', serverUrl);
  
  return serverUrl;
}
