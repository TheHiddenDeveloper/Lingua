
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logVoiceToText } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useGhanaNLP } from '@/contexts/GhanaNLPContext'; 

const supportedApiLanguages = [ { code: 'tw', name: 'Twi' }, ];

export default function VoiceToTextGhanaNLPPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('tw'); 
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchGhanaNLP, getApiKeyBasic, getApiKeyDev } = useGhanaNLP(); 

  const getSupportedMimeType = () => { const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav']; for (const type of types) { if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type; } return 'audio/webm'; };
  const mimeType = getSupportedMimeType();

  useEffect(() => {
    const apiKeyBasic = getApiKeyBasic(); const apiKeyDev = getApiKeyDev();
    if (!apiKeyBasic && !apiKeyDev) { setPageError("API key is missing. Configure NEXT_PUBLIC_GHANANLP_API_KEY_BASIC or _DEV."); toast({ title: 'Config Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); }
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) { setPageError("Microphone access not supported by your browser."); toast({ title: 'Browser Incompatible', description: 'Mic access not supported.', variant: 'destructive' }); }
    return () => { if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; } if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") { mediaRecorderRef.current.stop(); } };
  }, [getApiKeyBasic, getApiKeyDev, toast]);

  const startRecordingProcess = async () => {
    if (isRecording || typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    const apiKeyBasic = getApiKeyBasic(); const apiKeyDev = getApiKeyDev();
    if (!apiKeyBasic && !apiKeyDev) { setPageError("API key missing."); toast({ title: 'Config Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); return; }
    setPageError(null); setTranscribedText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioStreamRef.current = stream;
      const options = mimeType ? { mimeType } : undefined; mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = async () => { const recordedMimeTypeFinal = mediaRecorderRef.current?.mimeType || audioChunksRef.current[0]?.type || 'audio/webm'; const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeTypeFinal }); audioChunksRef.current = []; if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; } if (audioBlob.size === 0) { setPageError("No audio recorded."); toast({ title: "Recording Error", description: "No audio captured.", variant: "destructive" }); setIsLoadingTranscription(false); return; } await transcribeAudio(audioBlob, recordedMimeTypeFinal); };
      mediaRecorderRef.current.onerror = (event: Event) => { const mediaRecorderError = event as any; console.error("MediaRecorder error:", mediaRecorderError.error || mediaRecorderError); setPageError(`MediaRecorder error: ${mediaRecorderError.error?.name || 'Unknown recording error.'}`); toast({ title: "Recording Error", description: `Error during recording: ${mediaRecorderError.error?.name || 'Try again.'}`, variant: "destructive" }); setIsRecording(false); setIsLoadingTranscription(false); if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; } };
      mediaRecorderRef.current.start(); setIsRecording(true); toast({ title: "Recording Started", description: "Speak now..." });
    } catch (err: any) { console.error("Error accessing microphone:", err); let errMsg = err.message || "Could not access microphone."; if (err.name === "NotAllowedError") errMsg = "Microphone permission denied. Please enable it in your browser settings."; else if (err.name === "NotFoundError") errMsg = "No microphone found. Please ensure one is connected and enabled."; else if (err.name === "NotReadableError") errMsg = "Microphone is currently in use or inaccessible. Please check other applications or browser settings."; setPageError(errMsg); toast({ title: "Microphone Error", description: errMsg, variant: "destructive" }); }
  };

  const stopRecordingProcess = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); setIsLoadingTranscription(true); toast({ title: "Recording Stopped", description: "Processing audio..." }); } };
  const transcribeAudio = async (audioBlob: Blob, blobType: string) => {
    const apiKeyBasic = getApiKeyBasic(); const apiKeyDev = getApiKeyDev();
    if (!apiKeyBasic && !apiKeyDev) { setPageError("API key missing."); toast({ title: 'API Error', description: 'GhanaNLP API key missing.', variant: 'destructive' }); setIsLoadingTranscription(false); return; }
    setIsLoadingTranscription(true); setPageError(null);
    const apiUrl = `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${selectedLanguage}`;
    try {
      const response = await fetchGhanaNLP(apiUrl, { method: 'POST', headers: { 'Content-Type': blobType }, body: audioBlob });
      const resultText = await response.text(); setTranscribedText(resultText); toast({ title: "Transcription Successful" });
      if (user && user.uid && resultText) { logVoiceToText({ userId: user.uid, recognizedSpeech: resultText, detectedLanguage: selectedLanguage }).then(logResult => { if (!logResult.success) { console.warn('Failed to log VOT to history (server-side):', logResult.error); toast({ title: 'History Logging Failed', description: `Could not save VOT to history: ${logResult.error || 'Unknown error'}`, variant: 'destructive'}); } }).catch (logError => { console.error("Client-side error calling logVoiceToText flow:", logError); toast({ title: 'History Logging Error', description: `Error trying to save VOT to history: ${logError.message || 'Unknown error'}`, variant: 'destructive'}); }); }
    } catch (err: any) { console.error("Transcription error:", err); const errorMsg = err.message || 'An unexpected error occurred during transcription.'; setPageError(errorMsg); toast({ title: 'Transcription Failed', description: errorMsg, variant: 'destructive' });
    } finally { setIsLoadingTranscription(false); }
  };
  const handleToggleRecording = () => { if (isRecording) stopRecordingProcess(); else startRecordingProcess(); };

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold">Voice-to-Text</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm sm:text-base">Record and transcribe Twi audio using GhanaNLP.</p>
      </div>
      {pageError && (<Alert variant="destructive" className="my-4 px-4 sm:px-6 py-3"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{pageError}</AlertDescription></Alert>)}
      
      <div className="p-4 sm:p-6 border rounded-lg bg-background shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Transcribe Audio</h2>
        <p className="text-xs sm:text-sm text-muted-foreground -mt-3">Select language, then {isRecording ? "Stop" : "Start"} Recording.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-auto">
            <Label htmlFor="language-select-vot" className="block mb-1 text-sm font-medium">Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language-select-vot" className="w-full sm:w-[180px]"> <SelectValue placeholder="Select language" /> </SelectTrigger>
              <SelectContent> {supportedApiLanguages.map(lang => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))} </SelectContent>
            </Select>
          </div>
          <Button onClick={handleToggleRecording} disabled={isLoadingTranscription || (!getApiKeyBasic() && !getApiKeyDev()) || (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))} className={`w-full sm:flex-1 btn-animated ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={isRecording ? "Stop recording" : "Start recording"}>
            {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {isLoadingTranscription && isRecording ? 'Stopping...' : isRecording ? 'Stop Recording' : 'Start Recording'}
            {isLoadingTranscription && !isRecording && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
          </Button>
        </div>
        
        {isLoadingTranscription && !isRecording && ( <div className="flex items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Transcribing...</p></div> )}
        
        <div>
          <Label htmlFor="transcription-output-vot" className="block mb-2 text-sm font-medium">Transcription Output:</Label>
          <ScrollArea className="h-[150px] sm:h-[200px] w-full rounded-md border">
            <Textarea id="transcription-output-vot" placeholder={isRecording ? "Recording audio..." : transcribedText ? "" : "Transcription will appear here..."} value={transcribedText} readOnly className="min-h-[130px] sm:min-h-[180px] text-base bg-muted/30 border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-3" aria-label="Transcription output" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

    