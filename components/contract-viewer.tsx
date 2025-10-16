"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenSquare, CheckCircle2 } from "lucide-react";

const engagementTypes = [
  "Intern",
  "Partnership", 
  "Contractual",
  "Sub-contractual",
  "Permanent",
  "Instructor",
  "Student",
  "Partner",
  "Course Developer",
  "Sponsor",
  "Customer",
  "Reseller",
] as const;

type EngagementType = typeof engagementTypes[number];

const ContractSchema = z.object({
  engagementType: z.string().min(1, { message: "Please select a type of engagement." }),
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  agree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type ContractFormValues = z.infer<typeof ContractSchema>;

const contractTemplates: Record<EngagementType, string> = {
  Intern: `
INTERNSHIP AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. ("Company") and you ("Intern").

1. Position and Duration
The Intern agrees to work as an intern for a period of 3-6 months in the specified department.

2. Responsibilities
- Complete assigned projects and tasks
- Attend team meetings and training sessions
- Maintain professional conduct

3. Compensation
This is an unpaid/paid internship position as discussed during the interview process.

4. Confidentiality
The Intern agrees to maintain confidentiality of all company information.
`,
  
  Permanent: `
PERMANENT EMPLOYMENT AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. ("Company") and you ("Employee").

1. Position and Duties
The Employee is hired for a permanent position with the following responsibilities:
- Perform duties as assigned by management
- Maintain professional standards
- Follow company policies and procedures

2. Compensation and Benefits
- Salary as discussed and agreed upon
- Standard company benefits package
- Annual performance reviews

3. Term and Termination
This is a permanent position subject to company policies and applicable laws.

4. Confidentiality and Non-Disclosure
Employee agrees to maintain strict confidentiality of company information.
`,

  Contractual: `
CONTRACTUAL AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. ("Company") and you ("Contractor").

1. Scope of Work
The Contractor agrees to provide specified services for the agreed duration.

2. Payment Terms
Payment will be made according to the agreed schedule and milestones.

3. Deliverables
All work products become the property of the Company upon completion.

4. Independent Contractor Status
This is a contractor relationship, not an employment relationship.
`,

  Partnership: `
PARTNERSHIP AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Partner").

1. Partnership Terms
Both parties agree to collaborate on specified projects or initiatives.

2. Responsibilities
Each party shall fulfill their agreed-upon obligations and responsibilities.

3. Revenue Sharing
Any revenue generated will be shared according to the agreed terms.

4. Duration
This partnership agreement is effective until terminated by either party.
`,

  "Sub-contractual": `
SUB-CONTRACTOR AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Sub-contractor").

1. Sub-contracting Terms
Services will be provided as a sub-contractor under the main project contract.

2. Scope of Work
Specific tasks and deliverables as outlined in the project specification.

3. Payment
Payment terms as agreed in the sub-contracting arrangement.
`,

  Instructor: `
INSTRUCTOR AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Instructor").

1. Teaching Responsibilities
Deliver high-quality instruction in your area of expertise.

2. Course Content
Develop and maintain up-to-date course materials.

3. Compensation
Payment per course or hourly rate as agreed.
`,

  Student: `
STUDENT AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Student").

1. Learning Commitment
Commit to active participation in courses and programs.

2. Code of Conduct
Maintain professional behavior and respect for others.

3. Certification
Successful completion may lead to certification.
`,

  Partner: `
BUSINESS PARTNER AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Business Partner").

1. Partnership Scope
Collaborative business relationship for mutual benefit.

2. Terms of Engagement
Specific terms as discussed and agreed upon.

3. Intellectual Property
Respect for each party's intellectual property rights.
`,

  "Course Developer": `
COURSE DEVELOPER AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Developer").

1. Content Development
Create educational content according to specifications.

2. Quality Standards
All content must meet company quality and educational standards.

3. Intellectual Property
Developed content becomes property of Uwezo Inc.
`,

  Sponsor: `
SPONSORSHIP AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Sponsor").

1. Sponsorship Terms
Support for specified events, programs, or initiatives.

2. Benefits
Recognition and promotional benefits as outlined.

3. Duration
Sponsorship term as agreed upon.
`,

  Customer: `
CUSTOMER AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Customer").

1. Services
Access to company services and products.

2. Terms of Service
Use of services subject to company terms and conditions.

3. Payment
Payment terms for services as applicable.
`,

  Reseller: `
RESELLER AGREEMENT

This agreement is entered on {DATE} between Uwezo Inc. and you ("Reseller").

1. Reseller Rights
Authorization to resell specified company products or services.

2. Commission Structure
Payment terms and commission rates as agreed.

3. Territory
Specific geographic or market territory if applicable.
`
};

interface ContractViewerProps {
  onSigned?: () => void;
}

export function ContractViewer({ onSigned }: ContractViewerProps) {
  const [isSigned, setIsSigned] = useState(false);
  const [signature, setSignature] = useState({ name: "", date: "", type: "" });
  const [date, setDate] = useState<string | null>(null);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(ContractSchema),
    defaultValues: {
      engagementType: "",
      fullName: "",
      agree: false,
    },
  });

  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);

  const selectedEngagementType = form.watch("engagementType") as EngagementType | "";

  const onSubmit = (data: ContractFormValues) => {
    setSignature({
      name: data.fullName,
      date: new Date().toLocaleString(),
      type: data.engagementType,
    });
    setIsSigned(true);
    onSigned?.();
  };
  
  const getContractContent = () => {
    if (!date) return "Loading...";
    if (!selectedEngagementType) return "Please select a contract type to view the agreement.";
    return contractTemplates[selectedEngagementType].replace(/{DATE}/g, date);
  };

  if (isSigned) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Contract Signed
          </CardTitle>
          <CardDescription>
            Thank you. The {signature.type} agreement was signed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="font-semibold">{signature.name}</p>
            <p className="text-sm text-muted-foreground">Signed on {signature.date}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenSquare className="h-5 w-5" />
          Sign Your Employment Contract
        </CardTitle>
        <CardDescription>
          Please select your engagement type, read the agreement carefully, and sign below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Engagement Type</label>
            <Select
              value={form.watch("engagementType")}
              onValueChange={(value) => form.setValue("engagementType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your engagement type" />
              </SelectTrigger>
              <SelectContent>
                {engagementTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.engagementType && (
              <p className="text-sm text-red-500">{form.formState.errors.engagementType.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Contract Agreement</h3>
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="whitespace-pre-line text-sm">
                {getContractContent()}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name (Digital Signature)</label>
              <Input
                {...form.register("fullName")}
                placeholder="Enter your full legal name"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                checked={form.watch("agree")}
                onCheckedChange={(checked) => form.setValue("agree", !!checked)}
              />
              <label className="text-sm leading-relaxed">
                I have read and agree to the terms and conditions of this employment contract.
                By typing my name above, I acknowledge that this serves as my digital signature.
              </label>
            </div>
            {form.formState.errors.agree && (
              <p className="text-sm text-red-500">{form.formState.errors.agree.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedEngagementType || !form.watch("fullName") || !form.watch("agree")}
          >
            Sign Contract
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}