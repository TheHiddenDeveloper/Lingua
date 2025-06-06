
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logVoiceToText } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

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
  const { user } = useAuth();
  const apiKey = process.env.NEXT_PUBLIC_GHANANLP_API_KEY;

  const getSupportedMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
    for (const type of types) { if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type; }
    return '';
  };
  const mimeType = getSupportedMimeType();

  useEffect(() => {
    if (!apiKey) { setPageError("API key is missing. Configure NEXT_PUBLIC_GHANANLP_API_KEY."); toast({ title: 'Config Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); }
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) { setPageError("Mic access not supported."); toast({ title: 'Browser Incompatible', description: 'Mic access not supported.', variant: 'destructive' }); }
    if (mimeType === '') { console.warn("No preferred MIME type for MediaRecorder. Using browser default."); }
    return () => {
      if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") { mediaRecorderRef.current.stop(); }
    };
  }, [apiKey, toast, mimeType]);

  const startRecordingProcess = async () => {
    if (isRecording || typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (!apiKey) { setPageError("API key missing."); toast({ title: 'Config Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); return; }
    setPageError(null); setTranscribedText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = async () => {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
        audioChunksRef.current = [];
        if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; }
        if (audioBlob.size === 0) { setPageError("No audio recorded."); toast({ title: "Recording Error", description: "No audio captured.", variant: "destructive" }); setIsLoading(false); return; }
        await transcribeAudio(audioBlob, recordedMimeType);
      };
      mediaRecorderRef.current.onerror = (event: Event) => {
        const mediaRecorderError = event as any;
        console.error("MediaRecorder error:", mediaRecorderError.error || mediaRecorderError);
        setPageError(`MediaRecorder error: ${mediaRecorderError.error?.name || 'Unknown recording error.'}`);
        toast({ title: "Recording Error", description: `Error during recording: ${mediaRecorderError.error?.name || 'Try again.'}`, variant: "destructive" });
        setIsRecording(false); setIsLoading(false);
        if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; }
      };
      mediaRecorderRef.current.start(); setIsRecording(true); toast({ title: "Recording Started", description: "Speak now..." });
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let errMsg = err.message || "Could not access microphone.";
      if (err.name === "NotAllowedError") errMsg = "Microphone permission denied.";
      else if (err.name === "NotFoundError") errMsg = "No microphone found.";
      else if (err.name === "NotReadableError") errMsg = "Microphone in use or inaccessible.";
      setPageError(errMsg); toast({ title: "Microphone Error", description: errMsg, variant: "destructive" });
    }
  };

  const stopRecordingProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false); setIsLoading(true);
      toast({ title: "Recording Stopped", description: "Processing audio..." });
    }
  };

  const transcribeAudio = async (audioBlob: Blob, blobType: string) => {
    if (!apiKey) { setPageError("API key missing."); toast({ title: 'API Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); setIsLoading(false); return; }
    setIsLoading(true); setPageError(null);
    const apiUrl = `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${selectedLanguage}`;
    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': blobType }, body: audioBlob });
      if (response.ok) {
        const resultText = await response.text();
        setTranscribedText(resultText); toast({ title: "Transcription Successful" });
        if (user && user.uid && resultText) { try { await logVoiceToText({ userId: user.uid, recognizedSpeech: resultText, detectedLanguage: selectedLanguage }); } catch (logError: any) { console.error("Failed to log VOT history:", logError); } }
      } else {
        let errorData; let errorMessage = `Transcription API failed: ${response.status} ${response.statusText}`;
        try { const contentType = response.headers.get("content-type"); if (contentType && contentType.includes("application/json")) { errorData = await response.json(); errorMessage = errorData?.message || errorData?.detail || `API Error: ${response.status} - ${JSON.stringify(errorData)}`; } else { errorData = await response.text(); errorMessage = errorData || errorMessage; } } catch (e) { console.error("Error parsing API error response:", e); }
        console.error("Transcription API error:", errorMessage);
        if (errorMessage.toLowerCase().includes('invalid subscription key') || errorMessage.toLowerCase().includes('access denied')) { setPageError(`API Key Error: ${errorMessage}. Check key/permissions.`); } else { setPageError(`API Error: ${errorMessage.substring(0, 300)}`); }
        toast({ title: 'Transcription Error', description: errorMessage.substring(0, 100), variant: 'destructive' });
      }
    } catch (err: any) {
      console.error("Transcription fetch error:", err);
      setPageError(`Network error: ${err.message}`);
      toast({ title: 'Transcription Failed', description: `Error: ${err.message}`, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleToggleRecording = () => { if (isRecording) stopRecordingProcess(); else startRecordingProcess(); };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Voice-to-Text</h1>
        <p className="text-muted-foreground mt-1 md:mt-2">Record and transcribe Twi audio.</p>
      </div>
      {pageError && (<Alert variant="destructive" className="my-4 px-4 sm:px-6 py-3"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{pageError}</AlertDescription></Alert>)}
      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle>Transcribe Audio</CardTitle>
          <CardDescription>Select language, then {isRecording ? "Stop" : "Start"} Recording.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-auto">
                <Label htmlFor="language-select-vot" className="sr-only">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger id="language-select-vot" className="w-full sm:w-[180px]"> <SelectValue placeholder="Select language" /> </SelectTrigger>
                    <SelectContent> {supportedApiLanguages.map(lang => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))} </SelectContent>
                </Select>
            </div>
            <Button onClick={handleToggleRecording} disabled={isLoading || !apiKey || (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))} className={`w-full sm:flex-1 btn-animated ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={isRecording ? "Stop recording" : "Start recording"}>
              {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isLoading && isRecording ? 'Stopping...' : isRecording ? 'Stop Recording' : 'Start Recording'}
              {isLoading && !isRecording && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
            </Button>
          </div>
          {isLoading && !isRecording && (
             <div className="flex items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Transcribing...</p></div>
          )}
          <Label htmlFor="transcription-output-vot" className="sr-only">Transcription Output</Label>
          <ScrollArea className="h-[150px] sm:h-[200px] w-full rounded-md border p-4 bg-muted/30">
            <Textarea id="transcription-output-vot" placeholder={isRecording ? "Recording audio..." : transcribedText ? "" : "Transcription will appear here..."} value={transcribedText} readOnly className="min-h-[130px] sm:min-h-[180px] text-base bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" aria-label="Transcription output" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
