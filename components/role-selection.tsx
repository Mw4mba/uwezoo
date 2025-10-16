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
    if (!selectedRole || !user) {
      setError("Please select a role");
      return;
    }

    if (selectedRole === "employer" && (!companyName || !companySize || !industry)) {
      setError("Please fill in all company details");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Update user profile with role selection
      const profileData = {
        user_id: user.id,
        role: selectedRole,
        role_selected: true,
        company_name: selectedRole === "employer" ? companyName : null,
        company_size: selectedRole === "employer" ? companySize : null,
        industry: selectedRole === "employer" ? industry : null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // If employer, create company record
      if (selectedRole === "employer") {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            industry: industry,
            size_range: companySize,
            owner_id: user.id
          });

        if (companyError) throw companyError;
      }

      onRoleSelected(selectedRole);
    } catch (error) {
      console.error('Error setting up role:', error);
      setError("Failed to set up your role. Please try again.");
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