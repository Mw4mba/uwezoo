"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Briefcase, 
  Building, 
  Upload, 
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { DocumentUploader } from "@/components/document-uploader";
import { QuizComponent } from "@/components/quiz-component";
import { ContractViewer } from "@/components/contract-viewer";
import type { UserProfile } from "@/lib/types/database";

interface JobOpening {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: string;
  salary_range: string;
  application_deadline: string;
  companies: {
    name: string;
    industry: string;
  } | null;
}

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [jobOpening, setJobOpening] = useState<JobOpening | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    cvUrl: "",
    contractSigned: false,
    quizCompleted: false,
    quizScore: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();
  const jobId = params.jobId as string;

  const loadJobOpening = useCallback(async () => {
    try {
      const { data: job, error } = await supabase
        .from('job_openings')
        .select(`
          *,
          companies(name, industry)
        `)
        .eq('id', jobId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      setJobOpening(job as JobOpening);
    } catch (error) {
      console.error('Error loading job opening:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  }, [jobId, router, supabase]);

  const ensureEmployeeRole = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user has a role selected
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, role_selected')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user role:', error);
        return;
      }

      // If no role selected or not employee, set as employee
      const profileData = profile as UserProfile | null;
      if (!profileData?.role_selected || profileData.role !== 'employee') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            role: 'employee',
            role_selected: true,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error setting employee role:', error);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadJobOpening();
  }, [loadJobOpening]);

  useEffect(() => {
    // Auto-select employee role for job applicants
    if (user && !loading) {
      ensureEmployeeRole();
    }
  }, [user, loading, ensureEmployeeRole]);

  const handleCvUpload = (url: string) => {
    setApplicationData(prev => ({ ...prev, cvUrl: url }));
    setCurrentStep(2);
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    setApplicationData(prev => ({ 
      ...prev, 
      quizCompleted: passed,
      quizScore: score 
    }));
    if (passed) {
      setCurrentStep(3);
    }
  };

  const handleContractSigned = () => {
    setApplicationData(prev => ({ ...prev, contractSigned: true }));
    setCurrentStep(4);
  };

  const submitApplication = async () => {
    if (!user || !jobOpening) return;

    setSubmitting(true);
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('job_applications')
        .insert({
          job_opening_id: jobOpening.id,
          applicant_id: user.id,
          cv_url: applicationData.cvUrl,
          cover_letter: applicationData.coverLetter,
          aptitude_score: applicationData.quizScore,
          status: 'pending'
        });      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!jobOpening) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground">
              This job opening may have expired or been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In to Apply</CardTitle>
            <CardDescription>
              You need to sign in to apply for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">{jobOpening.title}</h3>
              <p className="text-sm text-muted-foreground">
                at {jobOpening.companies?.name}
              </p>
            </div>
            <Button onClick={() => signInWithGoogle()} className="w-full">
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for applying to {jobOpening.title} at {jobOpening.companies?.name}.
              We&apos;ll review your application and get back to you soon.
            </p>
            <Button onClick={() => router.push('/protected')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Upload CV", completed: !!applicationData.cvUrl },
    { number: 2, title: "Complete Assessment", completed: applicationData.quizCompleted },
    { number: 3, title: "Review Contract", completed: applicationData.contractSigned },
    { number: 4, title: "Submit Application", completed: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Job Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{jobOpening.title}</CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {jobOpening.companies?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {jobOpening.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {jobOpening.employment_type}
                  </span>
                </div>
              </div>
              <Badge variant="default">{jobOpening.companies?.industry}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{jobOpening.description}</p>
            {jobOpening.requirements && (
              <div>
                <h4 className="font-medium mb-2">Requirements:</h4>
                <p className="text-sm text-muted-foreground">{jobOpening.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.completed ? 'bg-green-600 text-white' : 
                      currentStep === step.number ? 'bg-primary text-white' : 
                      'bg-muted text-muted-foreground'}
                  `}>
                    {step.completed ? '✓' : step.number}
                  </div>
                  <span className={`text-sm ${
                    step.completed ? 'text-green-600' : 
                    currentStep === step.number ? 'text-primary' : 
                    'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your CV
              </CardTitle>
              <CardDescription>
                Please upload your CV for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader onUploadComplete={handleCvUpload} />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Assessment
              </CardTitle>
              <CardDescription>
                Take this quick assessment to demonstrate your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuizComponent onQuizComplete={handleQuizComplete} />
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and Sign Contract</CardTitle>
              <CardDescription>
                Please review the employment contract terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractViewer onSigned={handleContractSigned} />
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Final Step: Submit Application</CardTitle>
              <CardDescription>
                Add a cover letter and submit your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell us why you're interested in this position..."
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData(prev => ({ 
                    ...prev, 
                    coverLetter: e.target.value 
                  }))}
                  rows={6}
                />
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Application Summary:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ CV uploaded</li>
                  <li>✓ Assessment completed (Score: {applicationData.quizScore}%)</li>
                  <li>✓ Contract reviewed and signed</li>
                </ul>
              </div>

              <Button 
                onClick={submitApplication} 
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}