"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Users, Brain, FileText, Video, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/protected");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Redirecting to your dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we take you to your onboarding.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-b-foreground/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                Uwezo Career Platform
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Welcome to <span className="text-primary">Uwezo</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your comprehensive career onboarding platform. Complete your journey from hire to productivity with our guided, interactive experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <AuthButton />
              <Button variant="outline" asChild>
                <Link href="#features">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Feature Grid */}
            <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>
                    Sign contracts, upload documents, and manage all your paperwork in one place
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Skills Assessment</CardTitle>
                  <CardDescription>
                    Take comprehensive quizzes and assessments to showcase your abilities
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Video className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Video Introductions</CardTitle>
                  <CardDescription>
                    Record and share video introductions to connect with your new team
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>
                    Get help from our intelligent onboarding assistant whenever you need it
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Buddy System</CardTitle>
                  <CardDescription>
                    Connect with experienced team members who will guide your journey
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Monitor your onboarding progress with detailed analytics and milestones
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of professionals who have successfully completed their onboarding with Uwezo.
            </p>
            <AuthButton />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Uwezo. All rights reserved.</p>
            <p className="mt-2">
              Powered by{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                className="font-medium hover:underline"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
