"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function FastLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-2 w-full" />
      </div>
      
      {/* Task cards skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-[200px]" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-[150px]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  );
}