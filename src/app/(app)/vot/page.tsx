
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logVoiceToText } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useGhanaNLP } from '@/contexts/GhanaNLPContext';
import { Encoder } from 'wav';

const supportedApiLanguages = [{ code: 'tw', name: 'Twi' }];

export default function VoiceToTextGhanaNLPPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('tw');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioBuffersRef = useRef<Float32Array[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchGhanaNLP, getApiKeyBasic } = useGhanaNLP();

  useEffect(() => {
    const apiKeyBasic = getApiKeyBasic();
    if (!apiKeyBasic) {
      setPageError("API key is missing. Configure NEXT_PUBLIC_GHANANLP_API_KEY_BASIC.");
      toast({ title: 'Config Error', description: 'GhanaNLP API key missing.', variant: 'destructive' });
    }
    if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      setPageError("Microphone access not supported by your browser.");
      toast({ title: 'Browser Incompatible', description: 'Mic access not supported.', variant: 'destructive' });
    }
    return () => {
      // Cleanup on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [getApiKeyBasic, toast]);

  const transcribeAudio = async (audioBlob: Blob) => {
    const apiKeyBasic = getApiKeyBasic();
    if (!apiKeyBasic) {
      setPageError("API key missing.");
      toast({ title: 'API Error', description: 'GhanaNLP API key missing.', variant: 'destructive' });
      setIsLoadingTranscription(false);
      return;
    }
    setIsLoadingTranscription(true);
    setPageError(null);

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');

    const apiUrl = `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${selectedLanguage}`;
    try {
      const response = await fetchGhanaNLP(apiUrl, {
        method: 'POST',
        body: formData,
      });
      const resultText = await response.text();
      setTranscribedText(resultText);
      toast({ title: "Transcription Successful" });
      if (user?.uid && resultText) {
        logVoiceToText({ userId: user.uid, recognizedSpeech: resultText, detectedLanguage: selectedLanguage })
          .catch(logError => console.error("Error logging VOT to history:", logError));
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during transcription.';
      setPageError(errorMsg);
      toast({ title: 'Transcription Failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoadingTranscription(false);
    }
  };

  const startRecordingProcess = async () => {
    if (isRecording || typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    setPageError(null);
    setTranscribedText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      audioBuffersRef.current = [];

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        audioBuffersRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(context.destination);

      setIsRecording(true);
      toast({ title: "Recording Started", description: "Speak now..." });

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let errMsg = err.message || "Could not access microphone.";
      if (err.name === "NotAllowedError") errMsg = "Microphone permission denied. Please enable it in your browser settings.";
      setPageError(errMsg);
      toast({ title: "Microphone Error", description: errMsg, variant: "destructive" });
    }
  };

  const stopRecordingProcess = async () => {
    if (!isRecording || !audioContextRef.current) return;
    
    setIsRecording(false);
    setIsLoadingTranscription(true);
    toast({ title: "Recording Stopped", description: "Processing audio..." });

    // Disconnect nodes to stop processing
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
   
    const recordedData = audioBuffersRef.current;
    audioBuffersRef.current = [];
    
    if (recordedData.length === 0) {
      setPageError("No audio was captured. Please try again.");
      toast({ title: "Recording Error", description: "No audio data was recorded.", variant: "destructive" });
      setIsLoadingTranscription(false);
      return;
    }
    
    // Create WAV file from the raw audio data
    const totalLength = recordedData.reduce((acc, val) => acc + val.length, 0);
    const concatenatedBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of recordedData) {
      concatenatedBuffer.set(buffer, offset);
      offset += buffer.length;
    }
    
    const wavEncoder = new Encoder({
      sampleRate: audioContextRef.current.sampleRate,
      numChannels: 1,
      bitDepth: 16,
    });
    
    wavEncoder.write(concatenatedBuffer);
    const wavBlob = new Blob([wavEncoder.end()], { type: 'audio/wav' });

    await transcribeAudio(wavBlob);

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
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
          <Button onClick={handleToggleRecording} disabled={isLoadingTranscription || !getApiKeyBasic() || (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))} className={`w-32 h-32 rounded-full flex flex-col items-center justify-center btn-animated ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={isRecording ? "Stop recording" : "Start recording"}>
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
                {transcribedText || "Your transcribed text will appear here..."}
              </p>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
