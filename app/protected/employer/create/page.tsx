"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { getBaseUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign,
  Users,
  FileText,
  Settings,
  Link as LinkIcon,
  Loader2
} from "lucide-react";

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: string;
  salary_range: string;
  positions_available: number;
  application_deadline: string;
  company_id: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    requirements: "",
    location: "",
    employment_type: "",
    salary_range: "",
    positions_available: 1,
    application_deadline: "",
    company_id: ""
  });
  const [generateLink, setGenerateLink] = useState(true);

  const supabase = createClient();

  // Load user's companies on component mount
  useEffect(() => {
    loadUserCompanies();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserCompanies = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id);

      if (error) throw error;
      setCompanies(data || []);
      
      // If user has only one company, auto-select it
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, company_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.company_id) {
      alert('Please select a company');
      return;
    }

    setSubmitting(true);
    try {
      const jobData = {
        ...formData,
        employer_id: user.id,
        positions_available: Number(formData.positions_available),
        is_active: true,
        application_link: generateLink ? `${getBaseUrl()}/apply/` : null
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: job, error } = await (supabase as any)
        .from('job_openings')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      // Update the application link with the actual job ID
      if (generateLink && job) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('job_openings')
          .update({ application_link: `${getBaseUrl()}/apply/${job.id}` })
          .eq('id', job.id);
      }

      alert('Job posting created successfully!');
      router.push('/protected/employer');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job posting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof JobFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Create Job Opening</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select 
                value={formData.company_id} 
                onValueChange={(value) => handleInputChange('company_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No companies found. Please create a company first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type *</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value) => handleInputChange('employment_type', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salary_range" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Salary Range
                </Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => handleInputChange('salary_range', e.target.value)}
                  placeholder="e.g. $80,000 - $120,000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positions" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Positions Available
                </Label>
                <Input
                  id="positions"
                  type="number"
                  min="1"
                  value={formData.positions_available}
                  onChange={(e) => handleInputChange('positions_available', parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Application Deadline
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.application_deadline}
                  onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="List the skills, experience, and qualifications needed for this role..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Configure how candidates can apply for this position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-link"
                checked={generateLink}
                onCheckedChange={(checked) => setGenerateLink(checked as boolean)}
              />
              <Label htmlFor="generate-link">
                Generate application link automatically
              </Label>
            </div>
            {generateLink && (
              <p className="text-sm text-muted-foreground mt-2">
                A unique application link will be created that candidates can use to apply directly.
                The link will guide them through CV upload, assessment, and contract signing.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || companies.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Job Opening'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}