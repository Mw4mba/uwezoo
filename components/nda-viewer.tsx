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
import { PenSquare, CheckCircle2 } from "lucide-react";

const NdaSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  agree: z.boolean().refine((val: boolean) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type NdaFormValues = z.infer<typeof NdaSchema>;

const ndaContentTemplate = `
NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement ("Agreement") is entered into as of {DATE} by and between Uwezo Inc., a company incorporated under the laws of [Jurisdiction] ("Disclosing Party") and the undersigned individual ("Receiving Party").

RECITALS

WHEREAS, the Disclosing Party possesses certain proprietary and confidential information relating to its business operations, technology, and trade secrets; and

WHEREAS, the Receiving Party desires to receive access to such confidential information for the purpose of evaluating potential business opportunities and relationships;

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION

"Confidential Information" shall mean any and all non-public, proprietary, or confidential information disclosed by the Disclosing Party to the Receiving Party, including but not limited to:

a) Technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.

b) All information disclosed orally, visually, electronically, or in writing, whether or not marked, designated, or otherwise identified as "confidential."

c) Information developed by the Receiving Party based upon or derived from Confidential Information.

2. NON-USE AND NON-DISCLOSURE OBLIGATIONS

The Receiving Party agrees to:

a) Hold and maintain all Confidential Information in strict confidence;
b) Not disclose any Confidential Information to third parties without prior written consent from the Disclosing Party;
c) Not use Confidential Information for any purpose other than evaluating potential business relationships;
d) Take reasonable precautions to prevent unauthorized disclosure of Confidential Information;
e) Limit access to Confidential Information to employees or advisors who have a legitimate need to know and who have been informed of the confidential nature of such information.

3. EXCEPTIONS

The obligations set forth in Section 2 shall not apply to information that:

a) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;
b) Was rightfully known by the Receiving Party prior to disclosure;
c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;
d) Is required to be disclosed by law or court order, provided that the Receiving Party gives prompt written notice to the Disclosing Party.

4. RETURN OF MATERIALS

Upon termination of this Agreement or upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all documents, materials, and other tangible manifestations of Confidential Information.

5. TERM AND TERMINATION

This Agreement shall remain in effect for a period of five (5) years from the date hereof, unless terminated earlier by mutual written consent of the parties.

6. REMEDIES

The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party, for which monetary damages would be inadequate. Therefore, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance.

7. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of laws principles.

8. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior agreements and understandings.

By signing below, the Receiving Party acknowledges that they have read, understood, and agree to be bound by all terms and conditions of this Non-Disclosure Agreement.

Date: {DATE}
`;

interface NdaViewerProps {
  onSigned?: () => void;
}

export function NdaViewer({ onSigned }: NdaViewerProps) {
  const [isSigned, setIsSigned] = useState(false);
  const [signature, setSignature] = useState({ name: "", date: "" });
  const [date, setDate] = useState<string | null>(null);

  const form = useForm<NdaFormValues>({
    resolver: zodResolver(NdaSchema),
    defaultValues: {
      fullName: "",
      agree: false,
    },
  });

  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);

  const onSubmit = (data: NdaFormValues) => {
    setSignature({
      name: data.fullName,
      date: new Date().toLocaleString(),
    });
    setIsSigned(true);
    onSigned?.();
  };
  
  const getRenderedNdaContent = () => {
    if (!date) return "Loading...";
    return ndaContentTemplate.replace(/{DATE}/g, date);
  };

  if (isSigned) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            NDA Signed
          </CardTitle>
          <CardDescription>
            Thank you. The Non-Disclosure Agreement was signed successfully.
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
          Non-Disclosure Agreement (NDA)
        </CardTitle>
        <CardDescription>
          Please read the NDA carefully and provide your digital signature below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Agreement Terms</h3>
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="whitespace-pre-line text-sm">
                {getRenderedNdaContent()}
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
                I have read and agree to the terms and conditions of this Non-Disclosure Agreement.
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
            disabled={!form.watch("fullName") || !form.watch("agree")}
          >
            Sign NDA
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}