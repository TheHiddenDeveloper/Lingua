
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useGhanaNLP } from '@/contexts/GhanaNLPContext';

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
    case 'tw': return 'ak-GH';
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
  const { fetchGhanaNLP, getApiKeyBasic, getApiKeyDev } = useGhanaNLP();

  useEffect(() => { if (transcript) { setInputText(prev => prev + transcript); } }, [transcript]);
  useEffect(() => { if (sttError) toast({ title: 'Voice Input Error', description: sttError, variant: 'destructive' }); }, [sttError, toast]);
  useEffect(() => { if (ttsError) toast({ title: 'Speech Output Error', description: ttsError, variant: 'destructive' }); }, [ttsError, toast]);

  const handleTranslate = async () => {
    if (!inputText.trim()) { toast({ title: 'Input Required', description: 'Please enter text to translate.', variant: 'destructive' }); return; }
    if (inputText.length > 1000) { toast({ title: 'Input Too Long', description: 'Input text must be 1000 characters or less.', variant: 'destructive' }); return; }
    const apiKeyBasicExists = !!getApiKeyBasic();
    const apiKeyDevExists = !!getApiKeyDev();
    if (!apiKeyBasicExists && !apiKeyDevExists) { const msg = 'Translation API key is not configured.'; toast({ title: 'API Key Missing', description: msg, variant: 'destructive' }); setTranslationPageError(msg); return; }

    setIsLoadingTranslation(true); setSummary(null); setAiError(null); setTranslationPageError(null); setOutputText('');
    const isLocalToLocal = sourceLang !== 'en' && targetLang !== 'en';

    try {
      let textForFinalTranslation = inputText; let sourceForFinalApiCall = sourceLang;
      if (isLocalToLocal) {
        const apiSourceLangToEn = sourceLang === 'ga' ? 'gaa' : sourceLang; const langPairToEn = `${apiSourceLangToEn}-en`;
        toast({ title: 'Step 1: Translating to English', description: 'Translating your input to English first for local language conversion.'});
        const responseToEn = await fetchGhanaNLP('https://translation-api.ghananlp.org/v1/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ in: inputText, lang: langPairToEn }), });
        const intermediateEnglishText = await responseToEn.text();
        if (!intermediateEnglishText.trim()) { throw new Error('Intermediate translation to English resulted in empty or whitespace text.'); }
        textForFinalTranslation = intermediateEnglishText; sourceForFinalApiCall = 'en';
        toast({ title: 'Step 2: Translating to Target Language', description: 'Now translating from English to your target local language.'});
      }
      const apiSourceForFinalStep = sourceForFinalApiCall === 'ga' ? 'gaa' : sourceForFinalApiCall; const apiTargetForFinalStep = targetLang === 'ga' ? 'gaa' : targetLang; const finalLangPair = `${apiSourceForFinalStep}-${apiTargetForFinalStep}`;
      const responseToTarget = await fetchGhanaNLP('https://translation-api.ghananlp.org/v1/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ in: textForFinalTranslation, lang: finalLangPair }), });
      const translatedText = await responseToTarget.text();
      if (!translatedText.trim() && isLocalToLocal) { throw new Error('Final translation from English to target local language resulted in empty or whitespace text.'); }
      else if (!translatedText.trim() && !isLocalToLocal) { throw new Error('Translation resulted in empty or whitespace text.'); }
      setOutputText(translatedText); toast({ title: 'Translation Complete', description: 'Text translated successfully.' });
      if (user && user.uid) { logTextTranslation({ userId: user.uid, originalText: inputText, translatedText, sourceLanguage: sourceLang, targetLanguage: targetLang }).then(logResult => { if (!logResult.success) { console.warn('Failed to log translation to history (server-side):', logResult.error); toast({ title: 'History Logging Failed', description: `Could not save translation to history: ${logResult.error || 'Unknown error'}`, variant: 'destructive'}); } }).catch(logError => { console.error("Client-side error calling logTextTranslation flow:", logError); toast({ title: 'History Logging Error', description: `Error trying to save translation to history: ${logError.message || 'Unknown error'}`, variant: 'destructive'}); }); }
    } catch (error: any) { console.error("Translation API call error:", error); const errorMsg = error.message || 'An unexpected error occurred during translation.'; setTranslationPageError(errorMsg); toast({ title: 'Translation Failed', description: errorMsg, variant: 'destructive' }); setOutputText('');
    } finally { setIsLoadingTranslation(false); }
  };

  const handleSummarize = async () => {
    if (!outputText.trim()) { toast({ title: 'No Output Text', description: 'Translate text first to get a summary.', variant: 'destructive' }); return; }
    setIsLoadingSummary(true); setSummary(null); setAiError(null);
    try {
      const targetLanguageName = supportedLanguages.find(l => l.code === targetLang)?.name || targetLang;
      const input: SummarizeTranslationInput = { translation: outputText, language: targetLanguageName };
      const result: SummarizeTranslationOutput = await summarizeTranslation(input);
      setSummary(result.summary); toast({ title: 'Summary Generated', description: 'Translation summary created successfully.' });
    } catch (error: any) { console.error("Summarization error:", error); let displayMessage = error.message || 'Failed to generate summary.'; if (error.message && error.message.includes('503') && (error.message.includes('overloaded') || error.message.includes('Service Unavailable'))) { displayMessage = 'The AI summarization service is currently overloaded or unavailable. Please try again in a few moments.'; } else if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) { displayMessage = 'The AI service API key is not configured correctly or is invalid. Please check the setup.'; } setAiError(displayMessage); toast({ title: 'Summarization Error', description: displayMessage, variant: 'destructive' }); }
    setIsLoadingSummary(false);
  };

  const handleSwapLanguages = () => { const tempLang = sourceLang; setSourceLang(targetLang); setTargetLang(tempLang); };
  const toggleVoiceInput = () => { if (!browserSupportsSpeechRecognition) { toast({ title: 'Unsupported Feature', description: 'Your browser does not support voice input.', variant: 'destructive' }); return; } if (isListening) stopListening(); else { setInputText(''); startListening(langToBCP47(sourceLang)); } };
  const handleSpeakOutput = () => { if (!browserSupportsTextToSpeech) { toast({ title: 'Unsupported Feature', description: 'Your browser does not support text-to-speech.', variant: 'destructive' }); return; } if (isSpeaking) cancelSpeech(); else if (outputText.trim()) speak(outputText, langToBCP47(targetLang)); else toast({ title: 'No Text', description: 'Nothing to speak.', variant: 'destructive' }); };
  const handleCopyInput = () => { if (!inputText) return; navigator.clipboard.writeText(inputText).then(() => toast({ title: 'Copied!', description: 'Input text copied.'})).catch(err => toast({ title: 'Copy Failed', variant: 'destructive' })); };
  const handleCopyOutput = () => { if (!outputText) return; navigator.clipboard.writeText(outputText).then(() => toast({ title: 'Copied!', description: 'Translated text copied.'})).catch(err => toast({ title: 'Copy Failed', variant: 'destructive' })); };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl text-center">Polyglot Translator</CardTitle>
          <CardDescription className="text-center">Translate between English and supported Ghanaian languages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {translationPageError && ( <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Translation Error</AlertTitle><AlertDescription>{translationPageError}</AlertDescription></Alert> )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="w-full sm:w-auto flex-1">
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger id="source-lang-select" className="w-full"><SelectValue placeholder="Translate from" /></SelectTrigger>
                <SelectContent>{supportedLanguages.map(lang => (<SelectItem key={`src-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSwapLanguages} variant="ghost" size="icon" className="btn-animated my-1 sm:my-0" aria-label="Swap languages"><ArrowRightLeft className="h-5 w-5 text-primary" /></Button>
            <div className="w-full sm:w-auto flex-1">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger id="target-lang-select" className="w-full"><SelectValue placeholder="Translate to" /></SelectTrigger>
                <SelectContent>{supportedLanguages.map(lang => (<SelectItem key={`tgt-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
            <div className="space-y-2">
              <Label htmlFor="input-text-area" className="text-lg font-medium">{supportedLanguages.find(l => l.code === sourceLang)?.name || 'Source'}</Label>
              <div className="relative">
                <Textarea id="input-text-area" placeholder="Enter text to translate (max 1000 chars)..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[200px] text-base resize-y pr-10" aria-label="Input text for translation" maxLength={1000}/>
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleVoiceInput} disabled={!browserSupportsSpeechRecognition} aria-label={isListening ? "Stop voice input" : "Start voice input"}><Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} /></Button>
                  <Button variant="ghost" size="icon" onClick={handleCopyInput} disabled={!inputText.trim()} aria-label="Copy input text"><Copy className="h-5 w-5" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-text-area" className="text-lg font-medium">{supportedLanguages.find(l => l.code === targetLang)?.name || 'Translation'}</Label>
              <div className="relative rounded-md border min-h-[200px] bg-muted/20 p-2">
                <ScrollArea className="h-[200px]">
                  <p id="output-text-area" className="text-base whitespace-pre-wrap p-2" aria-label="Translated text output">{isLoadingTranslation ? 'Translating...' : outputText || 'Translation will appear here...'}</p>
                </ScrollArea>
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <Button variant="ghost" size="icon" onClick={handleSpeakOutput} disabled={!browserSupportsTextToSpeech || !outputText.trim()} aria-label={isSpeaking ? "Stop speaking" : "Speak translated text"}><Volume2 className={`h-5 w-5 ${isSpeaking ? 'text-destructive animate-pulse' : ''}`} /></Button>
                  <Button variant="ghost" size="icon" onClick={handleCopyOutput} disabled={!outputText.trim()} aria-label="Copy translated text"><Copy className="h-5 w-5" /></Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button onClick={handleTranslate} disabled={isLoadingTranslation || !inputText.trim()} size="lg" className="w-full sm:w-auto min-w-[200px] btn-animated">
                {isLoadingTranslation ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />} Translate
            </Button>
            {outputText && !isLoadingTranslation && (
                 <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isLoadingSummary || !outputText.trim()} className="btn-animated w-full sm:w-auto min-w-[200px]">
                    {isLoadingSummary ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />} AI Summary
                </Button>
            )}
        </CardFooter>
      </Card>
      
      {aiError && ( <Alert variant="destructive" className="mt-4 md:mt-6 max-w-4xl mx-auto"><AlertTriangle className="h-4 w-4" /><AlertTitle>AI Summarization Error</AlertTitle><AlertDescription>{aiError}</AlertDescription></Alert> )}

      {summary && (
        <Card className="mt-4 md:mt-6 max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-lg sm:text-xl">Translation Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[100px] sm:h-[150px] w-full rounded-md border p-3 sm:p-4 bg-background">
                    <p className="text-sm whitespace-pre-wrap">{summary}</p>
                </ScrollArea>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
