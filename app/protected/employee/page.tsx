"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  MapPin,
  Building
} from "lucide-react";

interface JobApplication {
  id: string;
  cv_url: string | null;
  cover_letter: string | null;
  aptitude_score: number | null;
  status: string;
  created_at: string;
  job_openings: {
    id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    salary_range: string;
    companies: {
      name: string;
      industry: string;
    } | null;
  } | null;
}

interface AvailableJob {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_range: string;
  application_deadline: string;
  is_active: boolean;
  companies: {
    name: string;
    industry: string;
  } | null;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmployeeData = async () => {
    try {
      // Load user's job applications
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: applicationsData, error: appsError } = await (supabase as any)
        .from('job_applications')
        .select(`
          *,
          job_openings(
            id,
            title,
            description,
            location,
            employment_type,
            salary_range,
            companies(name, industry)
          )
        `)
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Load available job openings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: jobsData, error: jobsError } = await (supabase as any)
        .from('job_openings')
        .select(`
          *,
          companies(name, industry)
        `)
        .eq('is_active', true)
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      setApplications(applicationsData || []);
      setAvailableJobs(jobsData || []);
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Track your applications and discover new opportunities
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Total Applications</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{applications.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium">Pending Review</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {applications.filter(app => app.status === 'pending').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Approved</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {applications.filter(app => app.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Job Applications
              </CardTitle>
              <CardDescription>
                Track the status of your submitted applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse available jobs and submit your first application
                  </p>
                  <Button onClick={() => window.location.href = '#jobs'}>
                    Browse Jobs
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">
                            {application.job_openings?.title || 'Unknown Position'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {application.job_openings?.companies?.name || 'Unknown Company'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {application.job_openings?.location || 'Remote'}
                            </span>
                          </div>
                          {application.aptitude_score && (
                            <p className="text-sm text-muted-foreground">
                              Assessment Score: {application.aptitude_score}%
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Applied on {new Date(application.created_at).toLocaleDateString()}
                      </p>
                      
                      {application.cover_letter && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary">
                            View Cover Letter
                          </summary>
                          <div className="mt-2 p-3 bg-muted rounded">
                            {application.cover_letter}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Available Job Openings
              </CardTitle>
              <CardDescription>
                Discover new career opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No jobs available</h3>
                  <p className="text-muted-foreground">
                    Check back later for new opportunities
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium text-lg">{job.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {job.companies?.name || 'Unknown Company'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                            <Badge variant="outline">
                              {job.employment_type}
                            </Badge>
                          </div>
                          {job.salary_range && (
                            <p className="text-sm font-medium text-green-600">
                              {job.salary_range}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => window.open(`/apply/${job.id}`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary">
                          {job.companies?.industry || 'General'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}