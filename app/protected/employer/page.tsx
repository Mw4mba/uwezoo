"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { getAbsoluteUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart, 
  Building, 
  Briefcase,
  Eye,
  Edit,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { DashboardLoadingSkeleton } from "@/components/loading-skeleton";

interface JobOpening {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  positions_available: number;
  is_active: boolean;
  application_link: string;
  created_at: string;
  _count?: {
    applications: number;
  };
}

interface JobWithApplications extends JobOpening {
  job_applications?: { count: number }[];
}

interface Application {
  id: string;
  applicant_id: string;
  status: string;
  applied_at: string;
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
  };
  job_opening: {
    title: string;
  };
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCompanyId = searchParams.get('company');
  
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });

  const supabase = createClient();

  // Role verification is now handled by useRole hook - no need for local checks

  // Memoize the loadDashboardData function to prevent unnecessary re-renders
  const loadDashboardData = React.useCallback(async () => {
    if (!user) return;

    try {
      // Load job openings with application counts
      const { data: jobs, error: jobsError } = await supabase
        .from('job_openings')
        .select(`
          *,
          job_applications(count)
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Load applications for this employer's jobs only if there are jobs
      let apps: Application[] = [];
      if (jobs && jobs.length > 0) {
        const jobIds = (jobs as JobWithApplications[]).map((job) => job.id);
        const { data: applications, error: appsError } = await supabase
          .from('job_applications')
          .select(`
            *,
            user_profiles!job_applications_applicant_id_fkey(first_name, last_name, email),
            job_openings!job_applications_job_opening_id_fkey(title)
          `)
          .in('job_opening_id', jobIds)
          .order('applied_at', { ascending: false });

        if (appsError) throw appsError;
        apps = (applications as Application[]) || [];
      }

      setJobOpenings((jobs as JobOpening[]) || []);
      setApplications(apps);

      // Calculate stats
      const totalJobs = jobs?.length || 0;
      const activeJobs = (jobs as JobOpening[])?.filter((job) => job.is_active).length || 0;
      const totalApplications = apps.length;
      const pendingApplications = apps.filter((app) => app.status === 'pending').length;

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
      });

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user && !dataLoaded) {
      loadDashboardData();
    }
  }, [user, dataLoaded, loadDashboardData]);

  const generateApplicationLink = (jobId: string) => {
    const baseUrl = getAbsoluteUrl();
    return `${baseUrl}/apply/${jobId}`;
  };

  const copyApplicationLink = (jobId: string) => {
    const link = generateApplicationLink(jobId);
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your job postings and review applications
            {selectedCompanyId && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Company-specific view
              </span>
            )}
          </p>
        </div>
        <Link href="/protected/employer/create-job">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Openings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4">
            {jobOpenings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No job openings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first job posting to start attracting talent
                  </p>
                  <Link href="/protected/employer/create-job">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              jobOpenings.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {job.title}
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {job.location} • {job.employment_type} • {job.positions_available} position(s)
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyApplicationLink(job.id)}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <Link href={`/protected/employer/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/protected/employer/jobs/${job.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {job.description?.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job._count?.applications || 0} applications
                      </span>
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="grid gap-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground">
                    Applications will appear here when candidates apply to your jobs
                  </p>
                </CardContent>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {application.applicant?.first_name} {application.applicant?.last_name}
                        </CardTitle>
                        <CardDescription>
                          Applied for: {application.job_opening?.title}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            application.status === 'pending' ? 'secondary' :
                            application.status === 'approved' ? 'default' :
                            application.status === 'rejected' ? 'destructive' : 'outline'
                          }
                        >
                          {application.status}
                        </Badge>
                        <Link href={`/protected/employer/applications/${application.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{application.applicant?.email}</span>
                      <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Recruitment Analytics
              </CardTitle>
              <CardDescription>
                Insights into your hiring performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting features are under development
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}