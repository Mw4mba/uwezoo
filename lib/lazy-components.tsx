import { lazy } from 'react';

// Lazy load heavy components to improve initial page load
export const LazyDocumentUploader = lazy(() => 
  import('@/components/document-uploader').then(module => ({ default: module.DocumentUploader }))
);

export const LazyAiAssistant = lazy(() => 
  import('@/components/ai-assistant').then(module => ({ default: module.AiAssistant }))
);

export const LazyQuizComponent = lazy(() => 
  import('@/components/quiz-component').then(module => ({ default: module.QuizComponent }))
);

export const LazyVideoIntroduction = lazy(() => 
  import('@/components/video-introduction').then(module => ({ default: module.VideoIntroduction }))
);

export const LazyBuddyChat = lazy(() => 
  import('@/components/buddy-chat').then(module => ({ default: module.BuddyChat }))
);

// Component wrapper to show loading state
export function LazyComponentWrapper({ 
  children, 
  fallback = <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <div className="min-h-[200px]">
      {children}
    </div>
  );
}