"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentUploaderProps {
  onUploadComplete?: (documentId: string) => void;
}

export function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user || !files.length) return;

    setIsUploading(true);
    const file = files[0];

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata to database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          document_type: getDocumentType(file.name),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedFiles(prev => [...prev, documentData]);
      onUploadComplete?.(documentData.id);

      // If it's a CV, trigger skill analysis (placeholder for now)
      if (getDocumentType(file.name) === 'cv') {
        await analyzeCVSkills(documentData.id);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('cv') || name.includes('resume')) return 'cv';
    if (name.includes('nda')) return 'nda';
    if (name.includes('contract')) return 'contract';
    return 'general';
  };

  const analyzeCVSkills = async (documentId: string) => {
    try {
      // Placeholder for CV skill analysis
      // This would integrate with OpenAI or similar service
      console.log('CV analysis would happen here for:', documentId);
      
      // For now, just update with placeholder analysis
      await supabase
        .from('documents')
        .update({
          analysis_result: {
            skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
            experience_years: 3,
            analyzed_at: new Date().toISOString()
          }
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('CV analysis error:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload your documents including CV, contracts, and other required files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT files up to 10MB
                </p>
              </div>
              <Button onClick={openFileDialog} variant="outline">
                Select Files
              </Button>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Uploaded Documents</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.original_filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.document_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {file.file_size ? (file.file_size / 1024 / 1024).toFixed(2) : '0'} MB
                      </span>
                    </div>
                  </div>
                  {file.analysis_result && (
                    <Badge variant="outline" className="text-xs">
                      Analyzed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Upload Guidelines</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• CV/Resume: Upload your latest CV for skill analysis</li>
                <li>• Contracts: Upload signed employment contracts</li>
                <li>• NDAs: Upload signed non-disclosure agreements</li>
                <li>• All documents should be in PDF format when possible</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}