"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Award,
  FileUp,
  UploadCloud,
  Facebook,
  Instagram,
  FileText,
  MessageSquare,
  Camera,
  Loader2,
  Save,
  ArrowLeft,
  Building,
  Plus,
  MapPin,
  Users,
  ExternalLink,
  Settings,
  Eye,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
  linkedin: z.string().url().or(z.literal("")).optional(),
  github: z.string().url().or(z.literal("")).optional(),
  portfolio: z.string().url().or(z.literal("")).optional(),
  credly: z.string().url().or(z.literal("")).optional(),
  facebook: z.string().url().or(z.literal("")).optional(),
  instagram: z.string().url().or(z.literal("")).optional(),
  kickresume: z.string().url().or(z.literal("")).optional(),
  whatsapp: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type DocumentType = 'transcript' | 'portfolio';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  credly?: string;
  facebook?: string;
  instagram?: string;
  kickresume?: string;
  whatsapp?: string;
  avatarUrl?: string;
  transcriptUrl?: string;
  portfolioUrl?: string;
  role?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  size_range?: string;
  description?: string;
  headquarters_location?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
}

// Company Card Component with Dropdown
function CompanyCard({ company, isOnlyCompany }: { company: Company; isOnlyCompany: boolean }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{company.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-6 w-6 p-0",
                      isOnlyCompany && "text-muted-foreground/50"
                    )}
                    disabled={isOnlyCompany}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/protected/employer?company=${company.id}`} className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Company Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Public Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="flex items-center gap-2 mt-1">
              {company.industry && (
                <>
                  <span>{company.industry}</span>
                  {company.size_range && <span>•</span>}
                </>
              )}
              {company.size_range && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {company.size_range}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {company.description && (
          <p className="text-sm text-muted-foreground mb-3 overflow-hidden text-ellipsis" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {company.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {company.headquarters_location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {company.headquarters_location}
              </span>
            )}
            {company.website && (
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <Globe className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
          <Link href={`/protected/employer?company=${company.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isUploadingDoc, setIsUploadingDoc] = useState<DocumentType | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  const supabase = createClient();

  // Role verification is now handled by useRole hook - no need for local checks

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
      linkedin: "",
      github: "",
      portfolio: "",
      credly: "",
      facebook: "",
      instagram: "",
      kickresume: "",
      whatsapp: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = form;

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        if (profile) {
          setUserProfile(profile);
          reset({
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            bio: profile.bio || "",
            linkedin: profile.linkedin || "",
            github: profile.github || "",
            portfolio: profile.portfolio_url || "",
            credly: profile.credly || "",
            facebook: profile.facebook || "",
            instagram: profile.instagram || "",
            kickresume: profile.kickresume || "",
            whatsapp: profile.whatsapp || "",
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase, reset]);

  // Load companies data for employers
  useEffect(() => {
    const loadCompanies = async () => {
      if (!user || !userProfile?.role || userProfile.role !== 'employer') {
        setLoadingCompanies(false);
        return;
      }

      try {
        const { data: companiesData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading companies:', error);
          return;
        }

        setCompanies(companiesData || []);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [user, userProfile, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
    
    setIsUploadingAvatar(true);
    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update user profile
      await updateProfile({ avatar_url: publicUrl });
      
      setSaveMessage("Profile picture updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setSaveMessage("Failed to upload profile picture.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `documents/${user.id}/${docType}/${Date.now()}.${fileExt}`;
    
    setIsUploadingDoc(docType);

    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update user profile
      const updateField = docType === 'transcript' ? 'transcript_url' : 'portfolio_url';
      await updateProfile({ [updateField]: publicUrl });

      setSaveMessage(`${docType.charAt(0).toUpperCase() + docType.slice(1)} uploaded successfully!`);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error(`Error uploading ${docType}:`, error);
      setSaveMessage(`Failed to upload ${docType}.`);
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsUploadingDoc(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Reload profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
    }
  };

  const onSave: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      await updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        bio: data.bio,
        linkedin: data.linkedin,
        github: data.github,
        portfolio_url: data.portfolio,
        credly: data.credly,
        facebook: data.facebook,
        instagram: data.instagram,
        kickresume: data.kickresume,
        whatsapp: data.whatsapp,
      });

      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage("Failed to save profile. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const isUploading = isUploadingAvatar || !!isUploadingDoc;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/protected">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            Keep your professional and personal information up-to-date.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes("successfully") 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {saveMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSave)} className="space-y-8">
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Saving..." : "Save All Changes"}
          </Button>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">
              <User className="mr-2 h-4 w-4" /> Personal Details
            </TabsTrigger>
            <TabsTrigger value="professional">
              <Briefcase className="mr-2 h-4 w-4" /> Professional Links
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileUp className="mr-2 h-4 w-4" /> Documents
            </TabsTrigger>
            {userProfile?.role === 'employer' && (
              <TabsTrigger value="companies">
                <Building className="mr-2 h-4 w-4" /> My Companies
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personal" className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details here. This information is
                    private.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        placeholder="e.g. Jane"
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        placeholder="e.g. Doe"
                      />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || "user@example.com"}
                        placeholder="you@company.com"
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Summary</Label>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      placeholder="Tell us a little bit about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Upload a new avatar.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 border-2 border-primary/20">
                    <AvatarImage src={userProfile?.avatar_url || user?.user_metadata?.avatar_url} alt="Your avatar" />
                    <AvatarFallback className="text-4xl">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <Label
                    htmlFor="picture"
                    className={cn("inline-flex items-center justify-center h-10 px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 w-full cursor-pointer", isUploadingAvatar && "opacity-50 cursor-not-allowed")}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {isUploadingAvatar ? "Uploading..." : "Choose Image"}
                  </Label>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Professional & Social Links</CardTitle>
                <CardDescription>
                  Help us get a complete picture of your professional life.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="linkedin"
                      {...register("linkedin")}
                      placeholder="https://linkedin.com/in/..."
                      className="pl-10"
                    />
                    {errors.linkedin && <p className="text-sm text-destructive">{errors.linkedin.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github"
                      {...register("github")}
                      placeholder="https://github.com/..."
                      className="pl-10"
                    />
                    {errors.github && <p className="text-sm text-destructive">{errors.github.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio/Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="portfolio"
                      {...register("portfolio")}
                      placeholder="https://your-portfolio.com"
                      className="pl-10"
                    />
                    {errors.portfolio && <p className="text-sm text-destructive">{errors.portfolio.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credly">Credly</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="credly"
                      {...register("credly")}
                      placeholder="https://www.credly.com/users/..."
                      className="pl-10"
                    />
                    {errors.credly && <p className="text-sm text-destructive">{errors.credly.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="facebook"
                      {...register("facebook")}
                      placeholder="https://facebook.com/..."
                      className="pl-10"
                    />
                    {errors.facebook && <p className="text-sm text-destructive">{errors.facebook.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      {...register("instagram")}
                      placeholder="https://instagram.com/..."
                      className="pl-10"
                    />
                    {errors.instagram && <p className="text-sm text-destructive">{errors.instagram.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kickresume">Kickresume</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="kickresume"
                      {...register("kickresume")}
                      placeholder="https://kickresume.com/..."
                      className="pl-10"
                    />
                    {errors.kickresume && <p className="text-sm text-destructive">{errors.kickresume.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      {...register("whatsapp")}
                      placeholder="e.g. +1234567890"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Upload supporting documents like transcripts or work
                  portfolios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transcripts">Transcripts</Label>
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="transcript-upload"
                      className={cn("flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted", isUploading && "opacity-50 cursor-not-allowed")}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploadingDoc === 'transcript' ? (
                          <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                        ) : (
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        )}
                        <p className="mb-2 text-sm text-muted-foreground">
                          {isUploadingDoc === 'transcript' ? 'Uploading...' : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOCX, or PNG (MAX. 10MB)
                        </p>
                      </div>
                      <Input
                        id="transcript-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'transcript')}
                        disabled={isUploading}
                      />
                    </Label>
                  </div>
                  {userProfile?.transcript_url && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Current file: <a href={userProfile.transcript_url} target="_blank" rel="noopener noreferrer" className="underline">View Transcript</a>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio-upload">Work Portfolio</Label>
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="portfolio-file-upload"
                      className={cn("flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted", isUploading && "opacity-50 cursor-not-allowed")}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploadingDoc === 'portfolio' ? (
                          <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                        ) : (
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        )}
                        <p className="mb-2 text-sm text-muted-foreground">
                          {isUploadingDoc === 'portfolio' ? 'Uploading...' : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ZIP, PDF or other project files (MAX. 50MB)
                        </p>
                      </div>
                      <Input
                        id="portfolio-file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'portfolio')}
                        disabled={isUploading}
                      />
                    </Label>
                  </div>
                  {userProfile?.portfolio_url && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Current file: <a href={userProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="underline">View Portfolio</a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {userProfile?.role === 'employer' && (
            <TabsContent value="companies" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">My Companies</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your companies and company profiles.
                  </p>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </div>

              {loadingCompanies ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : companies.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {companies.map((company) => (
                    <CompanyCard 
                      key={company.id} 
                      company={company} 
                      isOnlyCompany={companies.length === 1}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No companies yet</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      You haven&apos;t created any companies yet. Create your first company to get started.
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Company
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </form>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <Skeleton className="h-10 w-96" />

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}