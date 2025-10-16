"use client";

import { useEffect } from 'react';
import { getAbsoluteUrl } from '@/lib/utils';

export default function URLTestPage() {
  useEffect(() => {
    console.log('=== URL TEST RESULTS ===');
    console.log('window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'undefined');
    console.log('VERCEL_URL:', process.env.VERCEL_URL || 'undefined');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('getAbsoluteUrl("/protected"):', getAbsoluteUrl('/protected'));
    console.log('getAbsoluteUrl("/auth/update-password"):', getAbsoluteUrl('/auth/update-password'));
    console.log('========================');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">URL Test Page</h1>
      <p>Check the browser console for URL test results.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Current URLs:</h2>
        <p><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</p>
        <p><strong>Protected URL:</strong> {getAbsoluteUrl('/protected')}</p>
        <p><strong>Update Password URL:</strong> {getAbsoluteUrl('/auth/update-password')}</p>
      </div>
    </div>
  );
}