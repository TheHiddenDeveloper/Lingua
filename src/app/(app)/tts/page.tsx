'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Label } from '@/components/ui/label';

interface ApiLanguage {
  code: string;
  name: string; // User-friendly name
  apiName: string; // Name used as key in speakers object, e.g. "Twi"
}

interface ApiSpeakersData {
  [key: string]: string[]; // e.g. { "Twi": ["twi_speaker_4", ...], "Ewe": [...] }
}

// Define which languages from PRD are supported by GhanaNLP TTS
const PRD_LANGUAGES_SUPPORTED_BY_TTS: ApiLanguage[] = [
  { code: 'tw', name: 'Twi', apiName: 'Twi' },
  { code: 'ee', name: 'Ewe', apiName: 'Ewe' },
  // Note: Kikuyu ('ki') is supported by API but not in LinguaGhana PRD core.
  // English, Ga, Dagbani from PRD are not listed in GhanaNLP TTS API docs.
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
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorResponseMessage = `Failed to fetch languages: ${errorData.message} (Status: ${response.status})`;
          }
        } catch (e) {
          // Ignore if error response is not JSON
        }
        throw new Error(errorResponseMessage);
      }
      const data = await response.json(); 
      // Ensure supportedApiLangCodes is an array, even if apiLangsFromServer is not.
      const apiLangsFromServer = data.languages;
      const supportedApiLangCodes = Array.isArray(apiLangsFromServer) ? apiLangsFromServer : [];
      
      const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => 
        supportedApiLangCodes.includes(prdLang.code)
      );
      
      setAvailableLanguages(filteredAppLanguages);
      if (filteredAppLanguages.length > 0) {
        setSelectedLanguageCode(filteredAppLanguages[0].code);
      } else {
        console.log('Full API response for languages endpoint (data):', data); // Added for diagnostics
        const apiLangsString = supportedApiLangCodes.length > 0 ? supportedApiLangCodes.join(', ') : 'none provided by API';
        const errorMessage = `The app is configured for Twi and Ewe Text-to-Speech. However, these languages were not found in the list of supported languages returned by the GhanaNLP API. ` +
                             `The API reported supporting: [${apiLangsString}]. Please verify your GhanaNLP API key and ensure it has permissions for TTS. If the issue persists, contact GhanaNLP support.`;
        setError(errorMessage);
        toast({
            title: 'Language Configuration Issue',
            description: `App requires Twi/Ewe for TTS. API supports: [${apiLangsString}]. Check key/permissions.`,
            variant: 'warning',
            duration: 10000 
         });
      }

    } catch (err: any) {
      setError(`Error fetching languages: ${err.message}`);
      toast({ title: 'API Error', description: `Could not load languages: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoadingLanguages(false);
    }
  }, [apiKey, toast]);

  const fetchSpeakers = useCallback(async () => {
    if (!apiKey) {
      setError("API key is missing. Cannot fetch speakers.");
      // Toast already shown by fetchLanguages if API key is missing
      return;
    }
    setIsLoadingSpeakers(true);
    setError(null);
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/speakers', {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch speakers: ${response.statusText}`);
      }
      const data: ApiSpeakersData = await response.json();
      setAllSpeakers(data);
    } catch (err: any) {
      setError(`Error fetching speakers: ${err.message}`);
      toast({ title: 'API Error', description: `Could not load speakers: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoadingSpeakers(false);
    }
  }, [apiKey, toast]);

  useEffect(() => {
    fetchLanguages();
    fetchSpeakers();
  }, [fetchLanguages, fetchSpeakers]);

  useEffect(() => {
    if (selectedLanguageCode && allSpeakers) {
      const currentLangObject = availableLanguages.find(lang => lang.code === selectedLanguageCode);
      const speakersForLang = currentLangObject ? allSpeakers[currentLangObject.apiName] || [] : [];
      setFilteredSpeakers(speakersForLang);
      if (speakersForLang.length > 0) {
        setSelectedSpeakerId(speakersForLang[0]);
      } else {
        setSelectedSpeakerId('');
      }
    } else {
      setFilteredSpeakers([]);
      setSelectedSpeakerId('');
    }
  }, [selectedLanguageCode, allSpeakers, availableLanguages]);

  const handleSpeak = async () => {
    if (!apiKey) {
      toast({ title: 'Configuration Error', description: 'GhanaNLP API key is not configured.', variant: 'destructive' });
      return;
    }
    if (!textToSpeak.trim()) {
      toast({ title: 'Input Required', description: 'Please enter text to speak.', variant: 'destructive' });
      return;
    }
    if (!selectedLanguageCode || !selectedSpeakerId) {
      toast({ title: 'Selection Required', description: 'Please select a language and a speaker.', variant: 'destructive' });
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    setAudioSrc(null); // Clear previous audio

    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: JSON.stringify({
          text: textToSpeak,
          language: selectedLanguageCode,
          speaker_id: selectedSpeakerId,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(audioUrl);
        toast({ title: 'Speech Synthesized', description: 'Audio ready to play.' });
      } else {
        const errorData = await response.json().catch(() => ({ message: `Synthesis failed with status: ${response.status}` }));
        throw new Error(errorData.message || `Synthesis failed: ${response.statusText}`);
      }
    } catch (err: any) {
      setError(`Synthesis error: ${err.message}`);
      toast({ title: 'Synthesis Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleLanguageChange = (newLangCode: string) => {
    setSelectedLanguageCode(newLangCode);
    // Speaker will be updated by useEffect dependency
    setAudioSrc(null); // Clear audio if language changes
  };
  
  const handleSpeakerChange = (newSpeakerId: string) => {
    setSelectedSpeakerId(newSpeakerId);
    setAudioSrc(null); // Clear audio if speaker changes
  }


  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Text-to-Speech (GhanaNLP API)</h1>
        <p className="text-muted-foreground mt-2">Convert text into spoken Twi or Ewe using high-quality voices.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="card-animated w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Synthesize Speech</CardTitle>
          <CardDescription>Enter text, select a language and speaker, then click Synthesize.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text to speak..."
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            className="min-h-[150px] text-base"
            aria-label="Text to speak"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language-select">Language</Label>
              {isLoadingLanguages ? <LoadingSpinner size="sm" className="mt-2"/> : (
                <Select 
                  value={selectedLanguageCode} 
                  onValueChange={handleLanguageChange}
                  disabled={availableLanguages.length === 0}
                >
                  <SelectTrigger id="language-select" className="w-full mt-1">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.length === 0 && !isLoadingLanguages && <SelectItem value="no-lang" disabled>No languages available</SelectItem>}
                    {availableLanguages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="speaker-select">Speaker</Label>
              {isLoadingSpeakers ? <LoadingSpinner size="sm" className="mt-2"/> : (
                <Select 
                  value={selectedSpeakerId} 
                  onValueChange={handleSpeakerChange}
                  disabled={filteredSpeakers.length === 0 || !selectedLanguageCode}
                >
                  <SelectTrigger id="speaker-select" className="w-full mt-1">
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSpeakers.length === 0 && !isLoadingSpeakers && selectedLanguageCode && <SelectItem value="no-speaker" disabled>No speakers for this language</SelectItem>}
                     {filteredSpeakers.length === 0 && !isLoadingSpeakers && !selectedLanguageCode && <SelectItem value="no-speaker-select" disabled>Select a language first</SelectItem>}
                    {filteredSpeakers.map(speakerId => (
                      <SelectItem key={speakerId} value={speakerId}>
                        {speakerId} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleSpeak} 
            disabled={isSynthesizing || isLoadingLanguages || isLoadingSpeakers || !textToSpeak.trim() || !selectedLanguageCode || !selectedSpeakerId}
            className="w-full sm:w-auto btn-animated mt-4"
            aria-label="Synthesize and play speech"
          >
            {isSynthesizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
            Synthesize
          </Button>

          {audioSrc && (
            <div className="mt-4">
              <Label>Generated Audio:</Label>
              <audio controls src={audioSrc} className="w-full mt-1" aria-label="Synthesized audio player">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
