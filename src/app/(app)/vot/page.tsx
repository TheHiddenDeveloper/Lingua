
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

const supportedLanguages = [
  { code: 'en', name: 'English', localName: 'English', bcp47: 'en-US' },
  { code: 'tw', name: 'Twi', localName: 'Twi', bcp47: 'ak-GH' }, // Akan (Twi is a dialect of Akan)
  { code: 'ga', name: 'Ga', localName: 'Ga', bcp47: 'ga-GH' },
  { code: 'dag', name: 'Dagbani', localName: 'Dagbani', bcp47: 'dag-GH' },
  { code: 'ee', name: 'Ewe', localName: 'Ewe', bcp47: 'ee-GH' },
];

export default function VoiceToTextPage() {
  const [selectedLang, setSelectedLang] = useState('en-US'); // BCP 47 tag
  const [fullTranscript, setFullTranscript] = useState('');
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, error: sttError, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (sttError) {
      toast({ title: 'Voice Input Error', description: sttError, variant: 'destructive' });
    }
  }, [sttError, toast]);

  useEffect(() => {
    if (transcript) {
      setFullTranscript(prev => prev + transcript + (transcript.endsWith('.') || transcript.endsWith('?') || transcript.endsWith('!') ? '\n' : ' '));
    }
  }, [transcript]);

  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({ title: 'Unsupported Feature', description: 'Your browser does not support voice input.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      setFullTranscript(''); // Clear previous full transcript for new session
      startListening(selectedLang);
    }
  };
  
  const getDisplayLanguageName = (bcp47: string) => {
    const lang = supportedLanguages.find(l => l.bcp47 === bcp47);
    return lang ? `${lang.name} (${lang.localName})` : bcp47;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Voice-to-Text</h1>
        <p className="text-muted-foreground mt-2">Transcribe spoken audio into text in real-time.</p>
      </div>

      {!browserSupportsSpeechRecognition && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support the Web Speech API for voice recognition. Please try a different browser.
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Transcribe Audio</CardTitle>
          <CardDescription>Select a language and start speaking to see the transcription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
             <Select 
              value={selectedLang} 
              onValueChange={setSelectedLang}
              disabled={!browserSupportsSpeechRecognition || isListening}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.bcp47} value={lang.bcp47}>
                     {getDisplayLanguageName(lang.bcp47)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={toggleListening} 
              disabled={!browserSupportsSpeechRecognition}
              className={`w-full sm:w-auto btn-animated ${isListening ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Button>
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/30">
            <Textarea
              placeholder="Transcription will appear here..."
              value={fullTranscript}
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
