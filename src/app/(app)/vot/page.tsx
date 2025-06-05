
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { logVoiceToText } from '@/ai/flows/log-history-flow'; // Import history logging
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

const supportedApiLanguages = [
  { code: 'tw', name: 'Twi' },
];

export default function VoiceToTextGhanaNLPPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('tw');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [pageError, setPageError] = useState<string | null>(null); 
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null); 
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
  const apiKey = process.env.NEXT_PUBLIC_GHANANLP_API_KEY;

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; 
  };
  const mimeType = getSupportedMimeType();

  useEffect(() => {
    if (!apiKey) {
      setPageError("API key is missing. Please configure NEXT_PUBLIC_GHANANLP_API_KEY in your environment variables. Voice-to-Text service cannot be used.");
      toast({ title: 'Configuration Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' });
    }
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      setPageError("Microphone access is not supported by your browser.");
      toast({ title: 'Browser Incompatible', description: 'Microphone access (getUserMedia) is not supported.', variant: 'destructive' });
    }
    if (mimeType === '') {
        console.warn("No explicitly preferred MIME type found for MediaRecorder. Using browser default. This might affect API compatibility if GhanaNLP API is strict about audio format.");
    }
    // Cleanup function to stop media stream if component unmounts while recording
    return () => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    };
  }, [apiKey, toast, mimeType]);

  const startRecordingProcess = async () => {
    if (isRecording || typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (!apiKey) {
        setPageError("API key is missing. Cannot start recording.");
        toast({ title: 'Configuration Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' });
        return;
    }
    setPageError(null);
    setTranscribedText(''); 
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream; 
      
      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
        audioChunksRef.current = []; 

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        
        if (audioBlob.size === 0) {
            setPageError("No audio data recorded. Please try again.");
            toast({ title: "Recording Error", description: "No audio data was captured.", variant: "destructive"});
            setIsLoading(false);
            return;
        }
        
        await transcribeAudio(audioBlob, recordedMimeType);
      };
      
      mediaRecorderRef.current.onerror = (event: Event) => {
        const mediaRecorderError = event as any; 
        console.error("MediaRecorder error:", mediaRecorderError.error || mediaRecorderError);
        setPageError(`MediaRecorder error: ${mediaRecorderError.error?.name || 'Unknown error during recording.'}`);
        toast({ title: "Recording Error", description: `An error occurred during recording: ${mediaRecorderError.error?.name || 'Please try again.'}`, variant: "destructive"});
        setIsRecording(false);
        setIsLoading(false);
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Speak now..." });

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let errMsg = err.message || "Could not access microphone.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Microphone permission denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "No microphone found. Please ensure a microphone is connected and enabled.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errMsg = "Microphone is already in use or could not be accessed. Please check other applications or browser tabs.";
      }
      setPageError(errMsg);
      toast({ title: "Microphone Error", description: errMsg, variant: "destructive" });
    }
  };

  const stopRecordingProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); 
      // Stream tracks are stopped in onstop to ensure data is processed
      setIsRecording(false);
      setIsLoading(true); 
      toast({ title: "Recording Stopped", description: "Processing audio..." });
    }
  };
  
  const transcribeAudio = async (audioBlob: Blob, blobType: string) => {
    if (!apiKey) {
      setPageError("API key is missing. Cannot transcribe.");
      toast({ title: 'API Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setPageError(null);

    const apiUrl = `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${selectedLanguage}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': blobType 
        },
        body: audioBlob, 
      });

      if (response.ok) {
        const resultText = await response.text(); 
        setTranscribedText(resultText);
        toast({ title: "Transcription Successful" });

        // Log VOT to history
        if (user && user.uid && resultText) {
            try {
              await logVoiceToText({
                userId: user.uid,
                recognizedSpeech: resultText,
                detectedLanguage: selectedLanguage,
              });
            } catch (logError: any) {
              console.error("Failed to log VOT history:", logError);
            }
          }

      } else {
        let errorData;
        let errorMessage = `Transcription API call failed with status: ${response.status} ${response.statusText}`;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                 errorData = await response.json();
                 errorMessage = errorData?.message || errorData?.detail || `API Error: ${response.status} - ${JSON.stringify(errorData)}`;
            } else {
                errorData = await response.text();
                errorMessage = errorData || errorMessage;
            }
        } catch (e) {
            console.error("Error parsing API error response:", e);
        }
        
        console.error("Transcription API error response:", errorMessage);
        
        if (errorMessage.toLowerCase().includes('invalid subscription key') || errorMessage.toLowerCase().includes('access denied')) {
          setPageError(`API Key Error: ${errorMessage}. Please check your NEXT_PUBLIC_GHANANLP_API_KEY and its permissions for the ASR service.`);
        }
        else {
          setPageError(`API Error: ${errorMessage.substring(0, 300)}`);
        }
        toast({ title: 'Transcription Error', description: errorMessage.substring(0, 100), variant: 'destructive' });
      }
    } catch (err: any) {
      console.error("Transcription fetch error:", err);
      setPageError(`Network or fetch error: ${err.message}`);
      toast({ title: 'Transcription Failed', description: `An unexpected error occurred: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecordingProcess();
    } else {
      startRecordingProcess();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Voice-to-Text (GhanaNLP API)</h1>
        <p className="text-muted-foreground mt-2">Record audio and transcribe it using the GhanaNLP API.</p>
      </div>

      {pageError && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Transcribe Audio</CardTitle>
          <CardDescription>
            Select language, then click {isRecording ? "'Stop Recording'" : "'Start Recording'"} to {isRecording ? "finish" : "begin"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {supportedApiLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button 
              onClick={handleToggleRecording} 
              disabled={isLoading || !apiKey || (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))}
              className={`w-full btn-animated ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isLoading && isRecording ? 'Stopping...' : isRecording ? 'Stop Recording' : 'Start Recording'}
              {isLoading && !isRecording && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
            </Button>
          </div>
          
          {isLoading && !isRecording && ( 
             <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Transcribing...</p>
            </div>
          )}
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/30">
            <Textarea
              placeholder={isRecording ? "Recording audio..." : transcribedText ? "" : "Transcription will appear here..."}
              value={transcribedText}
              readOnly
              className="min-h-[180px] text-base bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              aria-label="Transcription output"
            />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
    
