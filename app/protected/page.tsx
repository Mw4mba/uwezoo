"use client";

import { useState } from "react";
import { useDashboard } from "./layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, FileText, Upload, Video, MessageSquare, Brain, User, ClipboardSignature, FileCheck } from "lucide-react";
import { DocumentUploader } from "@/components/document-uploader";
import { AiAssistant } from "@/components/ai-assistant";
import { QuizComponent } from "@/components/quiz-component";
import { VideoIntroduction } from "@/components/video-introduction";
import { ContractViewer } from "@/components/contract-viewer";
import { NdaViewer } from "@/components/nda-viewer";
import { BuddyChat } from "@/components/buddy-chat";

const TaskIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'document': return <FileText className="h-5 w-5" />;
    case 'upload': return <Upload className="h-5 w-5" />;
    case 'video': return <Video className="h-5 w-5" />;
    case 'chat': return <MessageSquare className="h-5 w-5" />;
    case 'quiz': return <Brain className="h-5 w-5" />;
    case 'form': return <User className="h-5 w-5" />;
    case 'contract': return <ClipboardSignature className="h-5 w-5" />;
    case 'nda': return <FileCheck className="h-5 w-5" />;
    default: return <Circle className="h-5 w-5" />;
  }
};

export default function ProtectedPage() {
  const { user } = useAuth();
  const { tasks, handleTaskCompletionChange, progressPercentage, loading, userRole } = useDashboard();
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Redirect employers to their dashboard
  if (userRole === 'employer') {
    window.location.href = '/protected/employer';
    return null;
  }

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "video":
        return (
          <VideoIntroduction 
            onVideoComplete={(videoId) => {
              console.log('Video uploaded:', videoId);
              const videoTask = tasks.find(t => t.task_type === 'video_intro');
              if (videoTask) {
                handleTaskCompletionChange(videoTask.id, true);
              }
              setActiveComponent(null);
            }}
          />
        );
      case "nda":
        return (
          <NdaViewer 
            onSigned={() => {
              const ndaTask = tasks.find(t => t.task_type === 'nda');
              if (ndaTask) {
                handleTaskCompletionChange(ndaTask.id, true);
              }
              setActiveComponent(null);
            }}
          />
        );
      case "contract":
        return (
          <ContractViewer 
            onSigned={() => {
              const contractTask = tasks.find(t => t.task_type === 'contract');
              if (contractTask) {
                handleTaskCompletionChange(contractTask.id, true);
              }
              setActiveComponent(null);
            }}
          />
        );
      case "upload":
        return (
          <DocumentUploader 
            onUploadComplete={(documentId) => {
              console.log('Document uploaded:', documentId);
              const uploadTask = tasks.find(t => t.task_type === 'cv_analysis' || t.task_type === 'document_upload');
              if (uploadTask) {
                handleTaskCompletionChange(uploadTask.id, true);
              }
              setActiveComponent(null);
            }}
          />
        );
      case "quiz":
        return (
          <QuizComponent 
            onQuizComplete={(passed, score) => {
              console.log('Quiz completed:', { passed, score });
              const quizTask = tasks.find(t => t.task_type === 'quiz');
              if (quizTask && passed) {
                handleTaskCompletionChange(quizTask.id, true);
              }
              setActiveComponent(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleTaskClick = (task: {
    id: number;
    task_type: string;
    completed?: boolean;
    title: string;
    description?: string | null;
  }) => {
    if (task.completed) return;
    
    switch (task.task_type) {
      case 'video_intro':
        setActiveComponent("video");
        break;
      case 'nda':
        setActiveComponent("nda");
        break;
      case 'contract':
        setActiveComponent("contract");
        break;
      case 'cv_analysis':
      case 'document_upload':
        setActiveComponent("upload");
        break;
      case 'quiz':
        setActiveComponent("quiz");
        break;
      case 'form':
        // Navigate to profile page
        window.location.href = '/protected/profile';
        break;
      default:
        // For other tasks, just mark as completed
        handleTaskCompletionChange(task.id, true);
        break;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome to Uwezo, {user?.user_metadata?.display_name || user?.email || 'User'}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete your onboarding journey to get started with your new role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
          <CardDescription>
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground">{progressPercentage}% complete</p>
          </div>
        </CardContent>
      </Card>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {activeComponent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Current Task</h2>
                <Button
                  variant="outline"
                  onClick={() => setActiveComponent(null)}
                >
                  Back to Dashboard
                </Button>
              </div>
              {renderActiveComponent()}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">Your Tasks</h2>
              
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className={`transition-all cursor-pointer hover:shadow-md ${
                      task.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                    }`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <TaskIcon type={task.task_type} />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </CardTitle>
                            {task.description && (
                              <CardDescription>{task.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.is_required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskCompletionChange(task.id, !task.completed);
                            }}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {progressPercentage === 100 && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800 dark:text-green-200">
                      🎉 Congratulations!
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      You&apos;ve completed all onboarding tasks. Welcome to the team!
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Sidebar (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-4">
            <AiAssistant />
            <BuddyChat className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
