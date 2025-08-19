
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logVoiceToText } from '@/ai/flows/log-history-flow';
import { transcribeAudioFlow } from '@/ai/flows/transcribe-audio-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useGhanaNLP } from '@/contexts/GhanaNLPContext';

const supportedApiLanguages = [{ code: 'tw', name: 'Twi' }];

export default function VoiceToTextGhanaNLPPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('tw');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();
  const { getApiKeyBasic } = useGhanaNLP();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  const handleStop = async () => {
    setIsLoadingTranscription(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Use a common browser format
    audioChunksRef.current = [];

    if (audioBlob.size === 0) {
      toast({ title: 'Recording Error', description: 'No audio was recorded.', variant: 'destructive' });
      setIsLoadingTranscription(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const result = await transcribeAudioFlow({ 
          audioDataUri: base64Audio, 
          language: selectedLanguage 
        });

        if (result.success && result.transcription) {
          setTranscribedText(result.transcription);
          toast({ title: 'Transcription Successful' });
          if (user?.uid) {
            logVoiceToText({ userId: user.uid, recognizedSpeech: result.transcription, detectedLanguage: selectedLanguage })
              .catch(logError => console.error('Error logging VOT to history:', logError));
          }
        } else {
          throw new Error(result.error || 'Transcription failed on the server.');
        }
      };
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during transcription.';
      setPageError(errorMsg);
      toast({ title: 'Transcription Failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoadingTranscription(false);
    }
  };

  const startRecordingProcess = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPageError("Microphone access not supported by your browser.");
      toast({ title: 'Browser Incompatible', description: 'Mic access not supported.', variant: 'destructive' });
      return;
    }
    if (!getApiKeyBasic()) {
      setPageError("API key is missing.");
      toast({ title: 'API Error', description: 'GhanaNLP API key missing.', variant: 'destructive' });
      return;
    }

    setPageError(null);
    setTranscribedText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', description: 'Speak now...' });
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      let errMsg = err.message || 'Could not access microphone.';
      if (err.name === 'NotAllowedError') errMsg = 'Microphone permission denied. Please enable it in your browser settings.';
      setPageError(errMsg);
      toast({ title: 'Microphone Error', description: errMsg, variant: 'destructive' });
    }
  };

  const stopRecordingProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      toast({ title: 'Recording Stopped', description: 'Processing audio...' });
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
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold">Voice-to-Text</CardTitle>
        <CardDescription className="text-muted-foreground mt-1 md:mt-2 text-sm sm:base">Record and transcribe Twi audio using GhanaNLP.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pageError && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{pageError}</AlertDescription></Alert>)}
        
        <div className="flex flex-col items-center gap-4">
            <Label htmlFor="language-select-vot" className="text-base font-medium">Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language-select-vot" className="w-full sm:w-[220px]"> <SelectValue placeholder="Select language" /> </SelectTrigger>
              <SelectContent> {supportedApiLanguages.map(lang => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))} </SelectContent>
            </Select>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleToggleRecording} disabled={isLoadingTranscription || !getApiKeyBasic()} className={`w-32 h-32 rounded-full flex flex-col items-center justify-center btn-animated ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
            {isRecording ? <StopCircle className="h-12 w-12 mb-1" /> : <Mic className="h-12 w-12 mb-1" />}
            <span className="text-lg font-semibold">{isRecording ? 'Stop' : 'Start'}</span>
          </Button>
        </div>

        {isLoadingTranscription && ( <div className="flex items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Transcribing audio...</p></div> )}
        
        <div>
          <Label htmlFor="transcription-output-vot" className="block mb-2 text-base font-medium">Transcription Output:</Label>
          <div className="p-4 rounded-lg bg-background min-h-[150px] border">
            <ScrollArea className="h-[150px] sm:h-[200px] w-full">
              <p id="transcription-output-vot" className="text-base whitespace-pre-wrap" aria-label="Transcription output">
                {transcribedText || 'Your transcribed text will appear here...'}
              </p>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
