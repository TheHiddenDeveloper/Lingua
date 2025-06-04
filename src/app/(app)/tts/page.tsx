
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const supportedLanguages = [
  { code: 'en', name: 'English', localName: 'English', bcp47: 'en-US' },
  { code: 'tw', name: 'Twi', localName: 'Twi', bcp47: 'ak-GH' }, // Akan (Twi is a dialect of Akan)
  { code: 'ga', name: 'Ga', localName: 'Ga', bcp47: 'ga-GH' },
  { code: 'dag', name: 'Dagbani', localName: 'Dagbani', bcp47: 'dag-GH' },
  { code: 'ee', name: 'Ewe', localName: 'Ewe', bcp47: 'ee-GH' },
];

export default function TextToSpeechPage() {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US'); // BCP 47 tag
  const { toast } = useToast();
  const { isSpeaking, speak, cancel: cancelSpeech, error: ttsError, browserSupportsTextToSpeech, availableVoices } = useTextToSpeech();

  useEffect(() => {
    if (ttsError) {
      toast({ title: 'Speech Output Error', description: ttsError, variant: 'destructive' });
    }
  }, [ttsError, toast]);

  const handleSpeak = () => {
    if (!browserSupportsTextToSpeech) {
      toast({ title: 'Unsupported Feature', description: 'Your browser does not support text-to-speech.', variant: 'destructive' });
      return;
    }
    if (!textToSpeak.trim()) {
      toast({ title: 'Input Required', description: 'Please enter text to speak.', variant: 'destructive' });
      return;
    }
    if (textToSpeak.length > 500) { // Arbitrary limit for TTS
      toast({ title: 'Input Too Long', description: 'Text to speak must be 500 characters or less.', variant: 'destructive' });
      return;
    }

    if (isSpeaking) {
      cancelSpeech();
    } else {
      speak(textToSpeak, selectedLang);
    }
  };
  
  const getDisplayLanguageName = (bcp47: string) => {
    const lang = supportedLanguages.find(l => l.bcp47 === bcp47);
    return lang ? `${lang.name} (${lang.localName})` : bcp47;
  };


  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Text-to-Speech</h1>
        <p className="text-muted-foreground mt-2">Convert text into spoken words in various languages.</p>
      </div>

      {!browserSupportsTextToSpeech && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support the Web Speech API for text-to-speech. Please try a different browser.
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Speak Text</CardTitle>
          <CardDescription>Enter text and select a language to hear it spoken.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text to speak (max 500 chars)..."
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            className="min-h-[150px] text-base"
            aria-label="Text to speak"
            maxLength={500}
            disabled={!browserSupportsTextToSpeech}
          />
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select 
              value={selectedLang} 
              onValueChange={setSelectedLang}
              disabled={!browserSupportsTextToSpeech || availableVoices.length === 0}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select language/voice" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages
                  .filter(lang => availableVoices.some(v => v.lang.startsWith(lang.bcp47.split('-')[0]))) // Filter by available base languages
                  .map(lang => (
                  <SelectItem key={lang.bcp47} value={lang.bcp47}>
                    {getDisplayLanguageName(lang.bcp47)}
                  </SelectItem>
                ))}
                {availableVoices.length === 0 && <SelectItem value="loading" disabled>Loading voices...</SelectItem>}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSpeak} 
              disabled={!browserSupportsTextToSpeech || !textToSpeak.trim() || (availableVoices.length === 0 && browserSupportsTextToSpeech)}
              className="w-full sm:w-auto btn-animated"
              aria-label={isSpeaking ? "Stop speaking" : "Speak text"}
            >
              {isSpeaking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
              {isSpeaking ? 'Stop' : 'Speak'}
            </Button>
          </div>
            {availableVoices.length > 0 && !supportedLanguages.some(lang => availableVoices.some(v => v.lang.startsWith(lang.bcp47.split('-')[0]))) && (
                 <p className="text-xs text-muted-foreground mt-1">
                    No specific voices for supported Ghanaian languages found. Default voices may be used.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
