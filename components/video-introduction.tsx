"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Play, Square, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoIntroductionProps {
  onVideoComplete?: (videoId: string) => void;
}

export function VideoIntroduction({ onVideoComplete }: VideoIntroductionProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setHasPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermission(false);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    let stream = streamRef.current;
    
    if (!stream) {
      stream = await requestPermissions();
      if (!stream) return;
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      
      // Stop all tracks
      stream?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };

    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
  }, [recordedChunks, requestPermissions]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const retakeVideo = useCallback(() => {
    setVideoUrl(null);
    setRecordedChunks([]);
    setUploadComplete(false);
    requestPermissions();
  }, [requestPermissions]);

  const uploadVideo = useCallback(async () => {
    if (!recordedChunks.length || !user) return;

    setIsUploading(true);
    
    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const fileName = `video-intro-${user.id}-${Date.now()}.webm`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Save video record to database
      const { data: videoData, error: dbError } = await supabase
        .from('video_introductions')
        .insert({
          user_id: user.id,
          filename: fileName,
          file_path: uploadData.path,
          file_size: blob.size,
          duration_seconds: 0, // Would be calculated from metadata
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadComplete(true);
      onVideoComplete?.(videoData.id);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [recordedChunks, user, onVideoComplete]);

  const handlePermissionRequest = async () => {
    await requestPermissions();
  };

  if (hasPermission === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Introduction
          </CardTitle>
          <CardDescription>
            Record a brief video introduction to complete your onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Video className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium mb-2">Camera & Microphone Access Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We need access to your camera and microphone to record your introduction video.
              </p>
              <Button onClick={handlePermissionRequest}>
                Grant Permissions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Introduction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
            <div>
              <h3 className="font-medium mb-2">Camera Access Denied</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please enable camera and microphone permissions in your browser settings and refresh the page.
              </p>
              <Button onClick={handlePermissionRequest} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Video Introduction Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Thank you!</h3>
              <p className="text-sm text-muted-foreground">
                Your video introduction has been uploaded successfully.
              </p>
            </div>
            <Badge variant="default">
              Task Completed
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Introduction
        </CardTitle>
        <CardDescription>
          Record a 1-2 minute video introducing yourself to the team
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted={!videoUrl}
            controls={!!videoUrl}
            src={videoUrl || undefined}
            className="w-full h-full object-cover"
          />
          
          {!videoUrl && !isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="h-12 w-12 mx-auto mb-2 opacity-75" />
                <p className="text-sm opacity-75">Camera preview will appear here</p>
              </div>
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!videoUrl ? (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="px-8"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={retakeVideo} variant="outline">
                Retake
              </Button>
              <Button 
                onClick={uploadVideo}
                disabled={isUploading}
                className="px-8"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Recording Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Keep your introduction between 1-2 minutes</li>
            <li>• Introduce yourself and your background</li>
            <li>• Share what excites you about this role</li>
            <li>• Speak clearly and maintain eye contact with the camera</li>
            <li>• Ensure good lighting and minimal background noise</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}