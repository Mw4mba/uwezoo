"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, User, Building, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RoleSelectionProps {
  onRoleSelected: (role: string) => void;
}

export function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const roles = [
    {
      id: "employee",
      title: "Employee",
      description: "Looking for job opportunities and career growth",
      icon: User,
      features: [
        "Apply to job openings",
        "Upload CV and portfolio",
        "Complete aptitude tests", 
        "Track application status",
        "Digital contract signing"
      ]
    },
    {
      id: "employer",
      title: "Employer",
      description: "Hiring talent and managing recruitment",
      icon: Building,
      features: [
        "Post job openings",
        "Manage applicants",
        "CV analysis and screening",
        "Create role criteria",
        "Generate application links",
        "Contract management"
      ]
    },
    {
      id: "independent",
      title: "Independent Contractor",
      description: "Freelancing and project-based work",
      icon: Briefcase,
      features: [
        "Showcase portfolio",
        "Contract negotiations",
        "Project proposals",
        "Client management",
        "Invoice generation"
      ]
    }
  ];

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-1000", label: "201-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
    "Retail", "Construction", "Consulting", "Media", "Government",
    "Non-profit", "Agriculture", "Transportation", "Energy", "Other"
  ];

  const handleSubmit = async () => {
    console.log('🎯 Role Selection: Starting submission...', { selectedRole, user: !!user });
    
    if (!selectedRole || !user) {
      const errorMsg = "Please select a role";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (selectedRole === "employer" && (!companyName || !companySize || !industry)) {
      const errorMsg = "Please fill in all company details";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log('📝 Role Selection: Updating user profile with role:', selectedRole);
      
      // If switching away from employer, clean up old company data
      if (selectedRole !== "employer") {
        console.log('🧹 Role Selection: Cleaning up company data for non-employer role');
        
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .eq('owner_id', user.id);
        
        if (deleteError && deleteError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          console.warn('⚠️ Could not delete old company:', deleteError);
          // Don't throw - continue with role change anyway
        } else if (!deleteError) {
          console.log('✅ Role Selection: Old company data cleaned up');
        }
      }
      
      // Update user profile with role selection
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileData = {
        user_id: user.id,
        role: selectedRole,
        primary_role: selectedRole,  // Update both role columns
        role_selected: true,
        company_name: selectedRole === "employer" ? companyName : null,
        company_size: selectedRole === "employer" ? companySize : null,
        industry: selectedRole === "employer" ? industry : null,
        updated_at: new Date().toISOString()
      };

      console.log('📋 Role Selection: Profile data:', {
        user_id: user.id,
        role: selectedRole,
        primary_role: selectedRole,
        exists: !!existingProfile
      });

      let profileError;
      if (existingProfile) {
        // Update existing profile
        console.log('📝 Role Selection: Updating existing profile');
        const result = await supabase
          .from('user_profiles')
          .update({
            role: selectedRole,
            primary_role: selectedRole,
            role_selected: true,
            company_name: selectedRole === "employer" ? companyName : null,
            company_size: selectedRole === "employer" ? companySize : null,
            industry: selectedRole === "employer" ? industry : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        profileError = result.error;
      } else {
        // Insert new profile
        console.log('🆕 Role Selection: Creating new profile');
        const result = await supabase
          .from('user_profiles')
          .insert(profileData);
        profileError = result.error;
      }

      if (profileError) {
        console.error('❌ Role Selection: Profile update failed:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        throw profileError;
      }
      
      console.log('✅ Role Selection: Profile updated successfully');

      // Only handle company creation/update for employers
      // For employee and independent, skip company logic entirely
      if (selectedRole === "employer") {
        console.log('🏢 Role Selection: Handling employer company creation...');
        
        // First check if user already has a company
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (existingCompany) {
          console.log('📝 Role Selection: Updating existing company:', existingCompany.id);
          
          // Update existing company
          const { error: companyError } = await supabase
            .from('companies')
            .update({
              name: companyName,
              industry: industry,
              size_range: companySize,
            })
            .eq('id', existingCompany.id);

          if (companyError) throw companyError;
          console.log('✅ Role Selection: Company updated successfully');
        } else {
          console.log('🆕 Role Selection: Creating new company...');
          
          // Generate unique slug using user ID fragment to avoid collisions
          const baseSlug = companyName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
          const uniqueSlug = `${baseSlug}-${user.id.substring(0, 8)}`;
          
          console.log('🔖 Role Selection: Generated unique slug:', uniqueSlug);
          
          // Create new company
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              slug: uniqueSlug,  // Add unique slug
              industry: industry,
              size_range: companySize,
              owner_id: user.id
            });

          if (companyError) {
            // If it's a duplicate error, just continue (409 conflict)
            if (companyError.code !== '23505') {
              throw companyError;
            }
            console.log('⚠️ Role Selection: Company already exists (ignored)');
          } else {
            console.log('✅ Role Selection: Company created successfully');
          }
        }
      }

      console.log('🎉 Role Selection: All operations complete, calling onRoleSelected');
      toast.success(`Role set as ${selectedRole}! Redirecting...`);
      onRoleSelected(selectedRole);
    } catch (error) {
      console.error('Error setting up role:', error);
      
      // Provide more specific error messages
      let errorMsg = "Failed to set up your role. Please try again.";
      
      if (error && typeof error === 'object') {
        const err = error as any;
        
        // Handle specific error codes
        if (err.code === '23505') {
          errorMsg = "A company with this name already exists. Please choose a different name.";
        } else if (err.code === '23503') {
          errorMsg = "Database reference error. Please contact support.";
        } else if (err.message) {
          errorMsg = `Error: ${err.message}`;
        }
        
        console.error('Error details:', {
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint
        });
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Welcome to Uwezo!</h1>
          <p className="text-xl text-muted-foreground">
            Let's get started by selecting your role on the platform
          </p>
        </div>

        <div className="space-y-6">
          <RadioGroup
            value={selectedRole}
            onValueChange={setSelectedRole}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedRole === role.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <RadioGroupItem value={role.id} className="sr-only" />
                      <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle>{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>

          {selectedRole === "employer" && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Please provide details about your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={!selectedRole || isSubmitting}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Setting up..." : "Continue to Dashboard"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}