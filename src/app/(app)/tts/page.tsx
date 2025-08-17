
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logTextToSpeech } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { useGhanaNLP } from '@/contexts/GhanaNLPContext';

export default function TextToSpeechPage() {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [filteredSpeakers, setFilteredSpeakers] = useState<string[]>([]);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { languages: availableLanguages, speakers: allSpeakers, isLoadingInitialData: isLoadingContextData, initialDataError: contextError, fetchGhanaNLP, getApiKeyBasic, getApiKeyDev } = useGhanaNLP();

  useEffect(() => { if (contextError) { setPageError(contextError); } else { setPageError(null); } }, [contextError]);
  useEffect(() => { if (availableLanguages.length > 0 && !selectedLanguageCode) { setSelectedLanguageCode(availableLanguages[0].code); } }, [availableLanguages, selectedLanguageCode]);
  useEffect(() => { if (selectedLanguageCode && allSpeakers) { const currentLangObject = availableLanguages.find(lang => lang.code === selectedLanguageCode); const speakersForLang = currentLangObject ? allSpeakers[currentLangObject.apiName] || [] : []; setFilteredSpeakers(speakersForLang); if (speakersForLang.length > 0) { if (!selectedSpeakerId || !speakersForLang.includes(selectedSpeakerId)) { setSelectedSpeakerId(speakersForLang[0]); } } else { setSelectedSpeakerId(''); } } else { setFilteredSpeakers([]); setSelectedSpeakerId(''); } }, [selectedLanguageCode, allSpeakers, availableLanguages, selectedSpeakerId]);

  const handleSpeak = async () => {
    const apiKeyBasic = getApiKeyBasic(); const apiKeyDev = getApiKeyDev();
    if (!apiKeyBasic && !apiKeyDev) { toast({ title: 'Configuration Error', description: 'GhanaNLP API keys are not configured.', variant: 'destructive' }); setPageError("GhanaNLP API Keys are missing. Please configure them."); return; }
    if (!textToSpeak.trim()) { toast({ title: 'Input Required', description: 'Please enter text to speak.', variant: 'destructive' }); return; }
    if (!selectedLanguageCode || !selectedSpeakerId) { toast({ title: 'Selection Required', description: 'Please select a language and a speaker.', variant: 'destructive' }); return; }
    setIsSynthesizing(true); setPageError(null); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null);
    try {
      const response = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textToSpeak, language: selectedLanguageCode, speaker_id: selectedSpeakerId }), });
      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('audio/wav')) {
        const audioBlob = await response.blob(); const typedAudioBlob = new Blob([audioBlob], { type: 'audio/wav' }); const audioUrl = URL.createObjectURL(typedAudioBlob); setAudioSrc(audioUrl); toast({ title: 'Speech Synthesized', description: 'Audio ready to play.' });
        if (user && user.uid) { logTextToSpeech({ userId: user.uid, spokenText: textToSpeak, selectedLanguage: selectedLanguageCode, speakerId: selectedSpeakerId }).then(logResult => { if (!logResult.success) { console.warn('Failed to log TTS to history (server-side):', logResult.error); toast({ title: 'History Logging Failed', description: `Could not save TTS to history: ${logResult.error || 'Unknown error'}`, variant: 'destructive'}); } }).catch(logError => { console.error("Client-side error calling logTextToSpeech flow:", logError); toast({ title: 'History Logging Error', description: `Error trying to save TTS to history: ${logError.message || 'Unknown error'}`, variant: 'destructive'}); }); }
      } else { let errorMessage = `Synthesis failed. Unexpected response. Status: ${response.status}`; if (contentType && contentType.includes('application/json')) { try { const errorData = await response.json(); errorMessage = errorData.message || errorData.detail || errorMessage; } catch (e) { /* Ignore */ } } else { try { const errorText = await response.text(); errorMessage = errorText || errorMessage; } catch (e) { /* Ignore */ } } throw new Error(errorMessage); }
    } catch (err: any) { setPageError(`Synthesis error: ${err.message}`); toast({ title: 'Synthesis Error', description: err.message, variant: 'destructive' });
    } finally { setIsSynthesizing(false); }
  };

  useEffect(() => { return () => { if (audioSrc) URL.revokeObjectURL(audioSrc); }; }, [audioSrc]);
  const handleLanguageChange = (newLangCode: string) => { setSelectedLanguageCode(newLangCode); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null); };
  const handleSpeakerChange = (newSpeakerId: string) => { setSelectedSpeakerId(newSpeakerId); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null); }

  if (isLoadingContextData) { return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner size="lg" /> <p className="ml-2">Loading TTS options...</p></div>; }

  return (
    <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold">Text-to-Speech</CardTitle>
            <CardDescription className="text-muted-foreground mt-1 md:mt-2 text-sm sm:text-base">Convert text into Twi or Ewe speech.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {pageError && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{pageError}</AlertDescription></Alert>)}
            
            <div>
              <Label htmlFor="tts-input" className="text-base font-medium">Text to Synthesize</Label>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Enter the text you want to hear spoken.</p>
              <Textarea id="tts-input" placeholder="Enter text to speak..." value={textToSpeak} onChange={(e) => setTextToSpeak(e.target.value)} className="min-h-[100px] sm:min-h-[150px] text-base resize-y" aria-label="Text to speak" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language-select-tts" className="block mb-1 text-sm font-medium">Language</Label>
                {(isLoadingContextData && availableLanguages.length === 0) ? <LoadingSpinner size="sm" className="mt-2"/> : (
                  <Select value={selectedLanguageCode} onValueChange={handleLanguageChange} disabled={availableLanguages.length === 0}>
                    <SelectTrigger id="language-select-tts" className="w-full mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      {availableLanguages.length === 0 && !isLoadingContextData && <SelectItem value="no-lang" disabled>No languages available</SelectItem>}
                      {availableLanguages.map(lang => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label htmlFor="speaker-select-tts" className="block mb-1 text-sm font-medium">Speaker</Label>
                {(isLoadingContextData && filteredSpeakers.length === 0 && !allSpeakers) ? <LoadingSpinner size="sm" className="mt-2"/> : (
                  <Select value={selectedSpeakerId} onValueChange={handleSpeakerChange} disabled={filteredSpeakers.length === 0 || !selectedLanguageCode}>
                    <SelectTrigger id="speaker-select-tts" className="w-full mt-1"><SelectValue placeholder="Select speaker" /></SelectTrigger>
                    <SelectContent>
                      {filteredSpeakers.length === 0 && !isLoadingContextData && selectedLanguageCode && <SelectItem value="no-speaker" disabled>No speakers for language</SelectItem>}
                      {filteredSpeakers.length === 0 && !isLoadingContextData && !selectedLanguageCode && <SelectItem value="no-speaker-select" disabled>Select language first</SelectItem>}
                      {filteredSpeakers.map(speakerId => (<SelectItem key={speakerId} value={speakerId}>{speakerId}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            {audioSrc && (
              <div className="mt-4 w-full">
                  <audio key={audioSrc} controls src={audioSrc} className="w-full" aria-label="Synthesized audio player">Your browser does not support the audio element.</audio>
              </div>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSpeak} disabled={isSynthesizing || isLoadingContextData || !textToSpeak.trim() || !selectedLanguageCode || !selectedSpeakerId} className="w-full btn-animated" size="lg" aria-label="Synthesize and play speech">
                {isSynthesizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />} Synthesize
            </Button>
        </CardFooter>
    </Card>
  );
}
