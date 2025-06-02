
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Volume2, ArrowRightLeft, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { summarizeTranslation, type SummarizeTranslationInput, type SummarizeTranslationOutput } from '@/ai/flows/summarize-translation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

const supportedLanguages = [
  { code: 'en', name: 'English', localName: 'English' },
  { code: 'tw', name: 'Twi', localName: 'Twi' },
  { code: 'ga', name: 'Ga', localName: 'Ga' },
  { code: 'dag', name: 'Dagbani', localName: 'Dagbani' },
  { code: 'ee', name: 'Ewe', localName: 'Ewe' },
];

// Map language codes to BCP 47 tags for speech APIs
const langToBCP47 = (langCode: string): string => {
  switch (langCode) {
    case 'en': return 'en-US';
    case 'tw': return 'ak-GH'; // Akan (Twi is a dialect of Akan)
    case 'ga': return 'ga-GH';
    case 'dag': return 'dag-GH'; // No specific BCP 47 for Dagbani, using generic. Might need testing.
    case 'ee': return 'ee-GH';
    default: return 'en-US';
  }
}

export default function TranslatePage() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('tw');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, error: sttError, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { isSpeaking, speak, cancel: cancelSpeech, error: ttsError, browserSupportsTextToSpeech } = useTextToSpeech();

  useEffect(() => {
    if (transcript) {
      setInputText(prev => prev + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (sttError) toast({ title: 'Voice Input Error', description: sttError, variant: 'destructive' });
  }, [sttError, toast]);

  useEffect(() => {
    if (ttsError) toast({ title: 'Speech Output Error', description: ttsError, variant: 'destructive' });
  }, [ttsError, toast]);


  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Input Required', description: 'Please enter text to translate.', variant: 'destructive' });
      return;
    }
    setIsLoadingTranslation(true);
    setSummary(null); // Clear previous summary
    setAiError(null);
    
    // Simulate API call
    // In a real app, replace this with:
    // const response = await fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: inputText, source: sourceLang, target: targetLang }) });
    // const data = await response.json();
    // setOutputText(data.translatedText);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const mockTranslatedText = `Translated (${sourceLang} to ${targetLang}): ${inputText.split('').reverse().join('')}`;
    setOutputText(mockTranslatedText);
    
    setIsLoadingTranslation(false);
    toast({ title: 'Translation Complete', description: 'Text translated successfully.' });
  };

  const handleSummarize = async () => {
    if (!outputText.trim()) {
      toast({ title: 'No Output Text', description: 'Translate text first to get a summary.', variant: 'destructive' });
      return;
    }
    setIsLoadingSummary(true);
    setSummary(null);
    setAiError(null);
    try {
      const targetLanguageName = supportedLanguages.find(l => l.code === targetLang)?.name || targetLang;
      const input: SummarizeTranslationInput = { translation: outputText, language: targetLanguageName };
      const result: SummarizeTranslationOutput = await summarizeTranslation(input);
      setSummary(result.summary);
      toast({ title: 'Summary Generated', description: 'Translation summary created successfully.' });
    } catch (error: any) {
      console.error("Summarization error:", error);
      let displayMessage = error.message || 'Failed to generate summary.';
      if (error.message && error.message.includes('503') && (error.message.includes('overloaded') || error.message.includes('Service Unavailable'))) {
        displayMessage = 'The AI summarization service is currently overloaded or unavailable. Please try again in a few moments.';
      } else if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
        displayMessage = 'The AI service API key is not configured correctly or is invalid. Please check the setup.';
      }
      setAiError(displayMessage);
      toast({ title: 'Summarization Error', description: displayMessage, variant: 'destructive' });
    }
    setIsLoadingSummary(false);
  };

  const toggleVoiceInput = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({ title: 'Unsupported Feature', description: 'Your browser does not support voice input.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening(langToBCP47(sourceLang));
    }
  };

  const handleSpeakOutput = () => {
    if (!browserSupportsTextToSpeech) {
      toast({ title: 'Unsupported Feature', description: 'Your browser does not support text-to-speech.', variant: 'destructive' });
      return;
    }
    if (isSpeaking) {
      cancelSpeech();
    } else if (outputText.trim()) {
      speak(outputText, langToBCP47(targetLang));
    } else {
      toast({ title: 'No Text', description: 'Nothing to speak.', variant: 'destructive' });
    }
  };
  
  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    // Optionally swap text as well
    // const tempText = inputText;
    // setInputText(outputText);
    // setOutputText(tempText);
  };


  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">LinguaGhana Translator</h1>
        <p className="text-muted-foreground mt-2">Translate between English and Ghanaian languages with ease.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="card-animated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">From:</CardTitle>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to translate..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[150px] text-base"
              aria-label="Input text for translation"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleVoiceInput} 
              className="mt-2 btn-animated" 
              disabled={!browserSupportsSpeechRecognition}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
            </Button>
            {!browserSupportsSpeechRecognition && <p className="text-xs text-muted-foreground mt-1">Voice input not supported.</p>}
          </CardContent>
        </Card>

        <Card className="card-animated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">To:</CardTitle>
             <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Translation will appear here..."
              value={outputText}
              readOnly
              className="min-h-[150px] bg-muted/30 text-base"
              aria-label="Translated text output"
            />
            <div className="mt-2 flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleSpeakOutput} 
                disabled={!browserSupportsTextToSpeech || !outputText.trim()}
                className="btn-animated"
                aria-label={isSpeaking ? "Stop speaking" : "Speak translated text"}
              >
                <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
               <Button 
                variant="outline" 
                onClick={handleSummarize} 
                disabled={isLoadingSummary || !outputText.trim()}
                className="btn-animated"
              >
                {isLoadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Summarize
              </Button>
            </div>
            {!browserSupportsTextToSpeech && <p className="text-xs text-muted-foreground mt-1">Text-to-speech not supported.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-2">
        <Button onClick={handleSwapLanguages} variant="ghost" size="icon" className="mx-2 btn-animated" aria-label="Swap languages">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
        </Button>
        <Button onClick={handleTranslate} disabled={isLoadingTranslation} size="lg" className="min-w-[150px] btn-animated">
          {isLoadingTranslation ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />}
          Translate
        </Button>
      </div>

      {summary && (
        <Card className="mt-6 card-animated">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Translation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] w-full rounded-md border p-4 bg-muted/20">
              <p className="text-sm whitespace-pre-wrap">{summary}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {aiError && (
         <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Summarization Error</AlertTitle>
          <AlertDescription>{aiError}</AlertDescription>
        </Alert>
      )}

    </div>
  );
}

    