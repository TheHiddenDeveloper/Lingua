
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Volume2, ArrowRightLeft, Loader2, FileText, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { summarizeTranslation, type SummarizeTranslationInput, type SummarizeTranslationOutput } from '@/ai/flows/summarize-translation';
import { logTextTranslation } from '@/ai/flows/log-history-flow';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useGhanaNLP } from '@/contexts/GhanaNLPContext'; // Import useGhanaNLP

const supportedLanguages = [
  { code: 'en', name: 'English', localName: 'English' },
  { code: 'tw', name: 'Twi', localName: 'Twi' },
  { code: 'ga', name: 'Ga', localName: 'Ga' },
  { code: 'dag', name: 'Dagbani', localName: 'Dagbani' },
  { code: 'ee', name: 'Ewe', localName: 'Ewe' },
];

const langToBCP47 = (langCode: string): string => {
  switch (langCode) {
    case 'en': return 'en-US';
    case 'tw': return 'ak-GH'; // Twi (Akan)
    case 'ga': return 'ga-GH';
    case 'dag': return 'dag-GH';
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
  const [translationPageError, setTranslationPageError] = useState<string | null>(null);


  const { toast } = useToast();
  const { user } = useAuth();
  const { isListening, transcript, startListening, stopListening, error: sttError, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { isSpeaking, speak, cancel: cancelSpeech, error: ttsError, browserSupportsTextToSpeech } = useTextToSpeech();
  const { fetchGhanaNLP, getApiKeyBasic, getApiKeyDev } = useGhanaNLP(); // Use context

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
    if (inputText.length > 1000) {
      toast({ title: 'Input Too Long', description: 'Input text must be 1000 characters or less.', variant: 'destructive' });
      return;
    }

    const apiKeyBasic = getApiKeyBasic();
    const apiKeyDev = getApiKeyDev();
    if (!apiKeyBasic && !apiKeyDev) {
      const msg = 'Translation API key is not configured.';
      toast({ title: 'API Key Missing', description: msg, variant: 'destructive' });
      setTranslationPageError(msg);
      return;
    }
    setIsLoadingTranslation(true);
    setSummary(null);
    setAiError(null);
    setTranslationPageError(null);
    setOutputText('');
    const apiSourceLang = sourceLang === 'ga' ? 'gaa' : sourceLang; // GhanaNLP uses 'gaa' for Ga
    const apiTargetLang = targetLang === 'ga' ? 'gaa' : targetLang;
    const langPair = `${apiSourceLang}-${apiTargetLang}`;
    try {
      const response = await fetchGhanaNLP('https://translation-api.ghananlp.org/v1/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Key handled by fetchGhanaNLP
        body: JSON.stringify({ in: inputText, lang: langPair }),
      });
      // fetchGhanaNLP throws on non-ok or handles 403 for key swap retry
      const translatedText = await response.text(); // Assuming text response for this endpoint
      setOutputText(translatedText);
      toast({ title: 'Translation Complete', description: 'Text translated successfully.' });
      if (user && user.uid) {
        try {
          await logTextTranslation({ userId: user.uid, originalText: inputText, translatedText, sourceLanguage: sourceLang, targetLanguage: targetLang });
        } catch (logError: any) { console.error("Failed to log translation history:", logError); }
      }
    } catch (error: any) {
      console.error("Translation API call error:", error);
      const errorMsg = error.message || 'An unexpected error occurred during translation.';
      setTranslationPageError(errorMsg);
      toast({ title: 'Translation Failed', description: errorMsg, variant: 'destructive' });
      setOutputText('');
    }
    setIsLoadingTranslation(false);
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
      const result: SummarizeTranslationOutput = await summarizeTranslation(input); // This uses Genkit, not GhanaNLP context
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
    if (isListening) stopListening(); else { setInputText(''); startListening(langToBCP47(sourceLang)); }
  };

  const handleSpeakOutput = () => {
    if (!browserSupportsTextToSpeech) {
      toast({ title: 'Unsupported Feature', description: 'Your browser does not support text-to-speech.', variant: 'destructive' });
      return;
    }
    if (isSpeaking) cancelSpeech(); else if (outputText.trim()) speak(outputText, langToBCP47(targetLang)); else toast({ title: 'No Text', description: 'Nothing to speak.', variant: 'destructive' });
  };

  const handleSwapLanguages = () => { const tempLang = sourceLang; setSourceLang(targetLang); setTargetLang(tempLang); };
  const handleCopyInput = () => { if (!inputText) return; navigator.clipboard.writeText(inputText).then(() => toast({ title: 'Copied!', description: 'Input text copied.'})).catch(err => toast({ title: 'Copy Failed', variant: 'destructive' })); };
  const handleCopyOutput = () => { if (!outputText) return; navigator.clipboard.writeText(outputText).then(() => toast({ title: 'Copied!', description: 'Translated text copied.'})).catch(err => toast({ title: 'Copy Failed', variant: 'destructive' })); };

  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      <div className="text-center mb-4 md:mb-6">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">LinguaGhana Translator</h1>
        <p className="text-muted-foreground mt-1 md:mt-2">Translate between English and Ghanaian languages.</p>
      </div>
      {translationPageError && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Translation Error</AlertTitle>
          <AlertDescription>{translationPageError}</AlertDescription>
        </Alert>
      )}

      {/* Language Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
        <Select value={sourceLang} onValueChange={setSourceLang}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Translate from" />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map(lang => (<SelectItem key={`src-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button onClick={handleSwapLanguages} variant="ghost" size="icon" className="btn-animated my-1 sm:my-0" aria-label="Swap languages">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
        </Button>
        <Select value={targetLang} onValueChange={setTargetLang}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Translate to" />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map(lang => (<SelectItem key={`tgt-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Input and Output Text Areas */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        <Card className="w-full card-animated flex-1">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-medium">
              {supportedLanguages.find(l => l.code === sourceLang)?.name || 'Source'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 sm:px-6 pb-4">
            <Textarea
              placeholder="Enter text to translate (max 1000 chars)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[150px] sm:min-h-[200px] text-base"
              aria-label="Input text for translation"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <Button variant="ghost" size="icon" onClick={toggleVoiceInput} disabled={!browserSupportsSpeechRecognition} aria-label={isListening ? "Stop voice input" : "Start voice input"}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopyInput} disabled={!inputText.trim()} aria-label="Copy input text">
                 <Copy className="h-5 w-5" />
              </Button>
            </div>
             {!browserSupportsSpeechRecognition && <p className="text-xs text-muted-foreground mt-1 text-center">Voice input not supported by browser.</p>}
          </CardContent>
        </Card>

        <Card className="w-full card-animated flex-1 mt-4 md:mt-0">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-medium">
              {supportedLanguages.find(l => l.code === targetLang)?.name || 'Translation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 sm:px-6 pb-4">
            <Textarea
              placeholder="Translation will appear here..."
              value={outputText}
              readOnly
              className="min-h-[150px] sm:min-h-[200px] bg-muted/30 text-base"
              aria-label="Translated text output"
            />
             <div className="flex justify-between items-center mt-1">
                <Button variant="ghost" size="icon" onClick={handleSpeakOutput} disabled={!browserSupportsTextToSpeech || !outputText.trim()} aria-label={isSpeaking ? "Stop speaking" : "Speak translated text"}>
                  <Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-destructive animate-pulse' : ''}`} />
                </Button>
                <div className="flex gap-2">
                     <Button variant="ghost" size="icon" onClick={handleCopyOutput} disabled={!outputText.trim()} aria-label="Copy translated text">
                        <Copy className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isLoadingSummary || !outputText.trim()} className="btn-animated">
                        {isLoadingSummary ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}
                        Summarize
                    </Button>
                </div>
            </div>
            {!browserSupportsTextToSpeech && <p className="text-xs text-muted-foreground mt-1 text-center">Text-to-speech not supported by browser.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center mt-4 md:mt-6">
        <Button onClick={handleTranslate} disabled={isLoadingTranslation || !inputText.trim()} size="lg" className="w-full sm:w-auto min-w-[180px] btn-animated">
          {isLoadingTranslation ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />}
          Translate
        </Button>
      </div>

      {/* Summary Section */}
      {summary && (
        <Card className="mt-4 md:mt-6 card-animated">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="font-headline text-lg sm:text-xl">Translation Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <ScrollArea className="h-[100px] sm:h-[150px] w-full rounded-md border p-3 sm:p-4 bg-muted/20">
              <p className="text-sm whitespace-pre-wrap">{summary}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* AI Error Alert for Summarization */}
      {aiError && (
         <Alert variant="destructive" className="mt-4 md:mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Summarization Error</AlertTitle>
          <AlertDescription>{aiError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
