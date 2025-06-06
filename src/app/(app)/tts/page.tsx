
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logTextToSpeech } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Label } from '@/components/ui/label';

interface ApiLanguage {
  code: string;
  name: string;
  apiName: string;
}

interface ApiSpeakersData {
  [key: string]: string[];
}

const PRD_LANGUAGES_SUPPORTED_BY_TTS: ApiLanguage[] = [
  { code: 'tw', name: 'Twi', apiName: 'Twi' },
  { code: 'ee', name: 'Ewe', apiName: 'Ewe' },
];


export default function TextToSpeechPage() {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');

  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>([]);
  const [allSpeakers, setAllSpeakers] = useState<ApiSpeakersData | null>(null);
  const [filteredSpeakers, setFilteredSpeakers] = useState<string[]>([]);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const apiKey = process.env.NEXT_PUBLIC_GHANANLP_API_KEY;

  const fetchLanguages = useCallback(async () => {
    if (!apiKey) {
      setError("API key is missing. Cannot fetch languages.");
      toast({ title: 'Configuration Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' });
      return;
    }
    setIsLoadingLanguages(true);
    setError(null);
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/languages', {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      });
      if (!response.ok) {
        let errorResponseMessage = `Failed to fetch languages: ${response.statusText} (Status: ${response.status})`;
        try { const errorData = await response.json(); if (errorData && errorData.message) errorResponseMessage = `Failed to fetch languages: ${errorData.message} (Status: ${response.status})`; } catch (e) {/*ignore*/}
        throw new Error(errorResponseMessage);
      }
      const data = await response.json();
      const apiLangObject = data.languages;
      const supportedApiLangCodes = apiLangObject && typeof apiLangObject === 'object' ? Object.keys(apiLangObject) : [];
      const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => supportedApiLangCodes.includes(prdLang.code));
      setAvailableLanguages(filteredAppLanguages);
      if (filteredAppLanguages.length > 0) {
        setSelectedLanguageCode(filteredAppLanguages[0].code);
      } else {
        const apiLangsString = supportedApiLangCodes.length > 0 ? supportedApiLangCodes.join(', ') : 'none provided by API';
        const errorMessage = `The app is configured for Twi and Ewe Text-to-Speech. However, these languages (codes: 'tw', 'ee') were not found in the list of supported language codes returned by the GhanaNLP API. The API reported supporting codes: [${apiLangsString}]. Please verify your GhanaNLP API key and ensure it has permissions for TTS.`;
        setError(errorMessage);
        toast({ title: 'Language Configuration Issue', description: `App requires Twi/Ewe. API supports: [${apiLangsString}]. Check key/permissions.`, variant: 'warning', duration: 10000 });
      }
    } catch (err: any) {
      setError(`Error fetching languages: ${err.message}`);
      toast({ title: 'API Error', description: `Could not load languages: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoadingLanguages(false);
    }
  }, [apiKey, toast]);

  const fetchSpeakers = useCallback(async () => {
    if (!apiKey) { setError("API key is missing. Cannot fetch speakers."); return; }
    setIsLoadingSpeakers(true); setError(null);
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/speakers', { headers: { 'Ocp-Apim-Subscription-Key': apiKey } });
      if (!response.ok) throw new Error(`Failed to fetch speakers: ${response.statusText} (Status: ${response.status})`);
      const data = await response.json();
      setAllSpeakers(data.speakers || {});
    } catch (err: any) {
      setError(`Error fetching speakers: ${err.message}`);
      toast({ title: 'API Error', description: `Could not load speakers: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoadingSpeakers(false);
    }
  }, [apiKey, toast]);

  useEffect(() => { fetchLanguages(); fetchSpeakers(); }, [fetchLanguages, fetchSpeakers]);

  useEffect(() => {
    if (selectedLanguageCode && allSpeakers) {
      const currentLangObject = availableLanguages.find(lang => lang.code === selectedLanguageCode);
      const speakersForLang = currentLangObject ? allSpeakers[currentLangObject.apiName] || [] : [];
      setFilteredSpeakers(speakersForLang);
      if (speakersForLang.length > 0) setSelectedSpeakerId(speakersForLang[0]); else setSelectedSpeakerId('');
    } else { setFilteredSpeakers([]); setSelectedSpeakerId(''); }
  }, [selectedLanguageCode, allSpeakers, availableLanguages]);

  const handleSpeak = async () => {
    if (!apiKey) { toast({ title: 'Configuration Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' }); return; }
    if (!textToSpeak.trim()) { toast({ title: 'Input Required', description: 'Please enter text to speak.', variant: 'destructive' }); return; }
    if (!selectedLanguageCode || !selectedSpeakerId) { toast({ title: 'Selection Required', description: 'Please select a language and a speaker.', variant: 'destructive' }); return; }
    setIsSynthesizing(true); setError(null); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null);
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': apiKey },
        body: JSON.stringify({ text: textToSpeak, language: selectedLanguageCode, speaker_id: selectedSpeakerId }),
      });
      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('audio/wav')) {
        const audioBlob = await response.blob();
        const typedAudioBlob = new Blob([audioBlob], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(typedAudioBlob);
        setAudioSrc(audioUrl);
        toast({ title: 'Speech Synthesized', description: 'Audio ready to play.' });
        if (user && user.uid) {
          try { await logTextToSpeech({ userId: user.uid, spokenText: textToSpeak, selectedLanguage: selectedLanguageCode, speakerId: selectedSpeakerId }); }
          catch (logError: any) { console.error("Failed to log TTS history:", logError); }
        }
      } else {
        let errorMessage = `Synthesis failed with status: ${response.status}`;
        if (contentType && contentType.includes('application/json')) { try { const errorData = await response.json(); errorMessage = errorData.message || errorData.detail || errorMessage; } catch (e) { /* Ignore */ } }
        else { try { const errorText = await response.text(); errorMessage = errorText || errorMessage; } catch (e) { /* Ignore */ } }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(`Synthesis error: ${err.message}`);
      toast({ title: 'Synthesis Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => { return () => { if (audioSrc) URL.revokeObjectURL(audioSrc); }; }, [audioSrc]);
  const handleLanguageChange = (newLangCode: string) => { setSelectedLanguageCode(newLangCode); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null); };
  const handleSpeakerChange = (newSpeakerId: string) => { setSelectedSpeakerId(newSpeakerId); if (audioSrc) URL.revokeObjectURL(audioSrc); setAudioSrc(null); }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Text-to-Speech</h1>
        <p className="text-muted-foreground mt-1 md:mt-2">Convert text into Twi or Ewe speech.</p>
      </div>
      {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Synthesize Speech</CardTitle>
          <CardDescription>Enter text, select language & speaker, then synthesize.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Enter text to speak..." value={textToSpeak} onChange={(e) => setTextToSpeak(e.target.value)} className="min-h-[100px] sm:min-h-[150px] text-base" aria-label="Text to speak" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language-select-tts">Language</Label>
              {isLoadingLanguages ? <LoadingSpinner size="sm" className="mt-2"/> : (
                <Select value={selectedLanguageCode} onValueChange={handleLanguageChange} disabled={availableLanguages.length === 0}>
                  <SelectTrigger id="language-select-tts" className="w-full mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    {availableLanguages.length === 0 && !isLoadingLanguages && <SelectItem value="no-lang" disabled>No languages available</SelectItem>}
                    {availableLanguages.map(lang => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="speaker-select-tts">Speaker</Label>
              {isLoadingSpeakers ? <LoadingSpinner size="sm" className="mt-2"/> : (
                <Select value={selectedSpeakerId} onValueChange={handleSpeakerChange} disabled={filteredSpeakers.length === 0 || !selectedLanguageCode}>
                  <SelectTrigger id="speaker-select-tts" className="w-full mt-1"><SelectValue placeholder="Select speaker" /></SelectTrigger>
                  <SelectContent>
                    {filteredSpeakers.length === 0 && !isLoadingSpeakers && selectedLanguageCode && <SelectItem value="no-speaker" disabled>No speakers for language</SelectItem>}
                    {filteredSpeakers.length === 0 && !isLoadingSpeakers && !selectedLanguageCode && <SelectItem value="no-speaker-select" disabled>Select language first</SelectItem>}
                    {filteredSpeakers.map(speakerId => (<SelectItem key={speakerId} value={speakerId}>{speakerId}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <Button onClick={handleSpeak} disabled={isSynthesizing || isLoadingLanguages || isLoadingSpeakers || !textToSpeak.trim() || !selectedLanguageCode || !selectedSpeakerId} className="w-full sm:w-auto btn-animated mt-4" aria-label="Synthesize and play speech">
            {isSynthesizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
            Synthesize
          </Button>
          {audioSrc && (
            <div className="mt-4">
              <Label>Generated Audio:</Label>
              <audio key={audioSrc} controls src={audioSrc} className="w-full mt-1" aria-label="Synthesized audio player">Your browser does not support the audio element.</audio>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
