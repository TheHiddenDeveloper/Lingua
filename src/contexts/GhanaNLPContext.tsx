
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiLanguage {
  code: string; // Internal app code (e.g., 'tw')
  name: string; // Display name (e.g., 'Twi')
  apiName: string; // Name/code used by GhanaNLP API for matching (e.g., 'tw')
}

interface ApiSpeakersData {
  [key: string]: string[]; // e.g., { "tw": ["speaker1", "speaker2"], "ee": ["speakerA"] }
}

interface GhanaNLPContextType {
  languages: ApiLanguage[];
  speakers: ApiSpeakersData | null;
  isLoadingInitialData: boolean;
  initialDataError: string | null;
  fetchGhanaNLP: (endpoint: string, options: RequestInit) => Promise<Response>;
  getApiKeyBasic: () => string | undefined;
}

const GhanaNLPContext = createContext<GhanaNLPContextType | undefined>(undefined);

// Languages the PRD specifies are supported by the app for TTS
// Ensure apiName matches the keys returned by the GhanaNLP /languages endpoint (e.g., "tw", "ee")
const PRD_LANGUAGES_SUPPORTED_BY_TTS: ApiLanguage[] = [
  { code: 'tw', name: 'Twi', apiName: 'tw' },
  { code: 'ee', name: 'Ewe', apiName: 'ee' },
];

export const GhanaNLPProvider = ({ children }: { children: ReactNode }) => {
  const apiKeyBasic = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_BASIC;

  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [speakers, setSpeakers] = useState<ApiSpeakersData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchGhanaNLP = useCallback(async (endpoint: string, options: RequestInit): Promise<Response> => {
    if (!apiKeyBasic) {
      const error = new Error("GhanaNLP API Key (basic) is not configured.");
      (error as any).noKeys = true;
      throw error;
    }

    const headers = { ...(options.headers || {}), 'Ocp-Apim-Subscription-Key': apiKeyBasic };
    
    try {
      const response = await fetch(endpoint, { ...options, headers });
      if (!response.ok) {
         let errorResponseMessage = `GhanaNLP API Error: ${response.statusText} (Status: ${response.status})`;
         try { 
            const errorDataText = await response.text();
            try {
                const errorDataJson = JSON.parse(errorDataText);
                if (errorDataJson && (errorDataJson.message || errorDataJson.detail) ) {
                    errorResponseMessage = `GhanaNLP API Error: ${errorDataJson.message || errorDataJson.detail}`;
                } else if (errorDataText) {
                    errorResponseMessage = `GhanaNLP API Error (${response.status}): ${errorDataText}`;
                }
            } catch (e) {
                if (errorDataText) { 
                     errorResponseMessage = `GhanaNLP API Error (${response.status}): ${errorDataText}`;
                }
            }
         } catch (e) {/*ignore silently if cannot read body*/}
         const error = new Error(errorResponseMessage);
         (error as any).response = response;
         throw error;
      }
      return response;
    } catch (error) {
      console.error('GhanaNLP Fetch Error:', error);
      throw error;
    }
  }, [apiKeyBasic]);


  useEffect(() => {
    const loadInitialData = async () => {
      if (!apiKeyBasic) { 
        setInitialDataError("No GhanaNLP API key configured. Please set NEXT_PUBLIC_GHANANLP_API_KEY_BASIC in your environment.");
        setIsLoadingInitialData(false);
        toast({ title: 'Configuration Error', description: 'GhanaNLP API key is missing.', variant: 'destructive' });
        return;
      }

      setIsLoadingInitialData(true);
      setInitialDataError(null);

      let langData: any = null;
      let speakerData: any = null;

      try {
        const langResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages', {});
        langData = await langResponse.json();
        
        const speakerResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/speakers', {});
        speakerData = await speakerResponse.json();

        const apiLanguages = langData.languages || (Array.isArray(langData) ? langData : []);

        const supportedApiLangCodes = Array.isArray(apiLanguages) 
          ? apiLanguages.map((lang: any) => lang.code || lang.name || lang.language).filter(Boolean) 
          : [];

        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => 
          supportedApiLangCodes.includes(prdLang.apiName)
        );
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0 && PRD_LANGUAGES_SUPPORTED_BY_TTS.length > 0) {
            const prdLangNames = PRD_LANGUAGES_SUPPORTED_BY_TTS.map(l => l.name).join('/');
            const rawLangDataString = JSON.stringify(langData, null, 2);
            const langErrorMessage = `App requires ${prdLangNames} for TTS, but no supported languages were found from the API. This is likely an issue with the API key or response format. Raw API language data: \n${rawLangDataString}`;
            setInitialDataError(langErrorMessage);
            toast({ title: 'Language Config Issue', description: 'Could not find supported TTS languages. Check console for details.', variant: 'warning', duration: 10000 });
        }
        
        const transformedSpeakers: ApiSpeakersData = {};
        const rawSpeakers = speakerData.speakers || (typeof speakerData === 'object' && speakerData !== null ? speakerData : {});

        if (typeof rawSpeakers === 'object') {
            for (const langApiName of Object.keys(rawSpeakers)) {
                const appLangDef = PRD_LANGUAGES_SUPPORTED_BY_TTS.find(
                    l => l.name.toLowerCase() === langApiName.toLowerCase() || 
                         l.apiName.toLowerCase() === langApiName.toLowerCase()
                );
                if (appLangDef) {
                    const speakerList = rawSpeakers[langApiName];
                    if (Array.isArray(speakerList) && speakerList.every(s => typeof s === 'string')) {
                         transformedSpeakers[appLangDef.apiName] = speakerList;
                    }
                }
            }
        }
        setSpeakers(transformedSpeakers);

      } catch (err: any) {
        if ((err as any).noKeys) {
             setInitialDataError(err.message);
        } else {
            const rawDataForError = `\n--- Raw Language Data ---\n${JSON.stringify(langData, null, 2)}\n--- Raw Speaker Data ---\n${JSON.stringify(speakerData, null, 2)}`;
            setInitialDataError((err.message || "Failed to load initial TTS options.") + rawDataForError);
        }
        toast({ title: 'API Error', description: `Could not load initial TTS options. Check console for details.`, variant: 'destructive' });
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [apiKeyBasic, toast, fetchGhanaNLP]);

  const getApiKeyBasic = () => apiKeyBasic;

  return (
    <GhanaNLPContext.Provider value={{ languages, speakers, isLoadingInitialData, initialDataError, fetchGhanaNLP, getApiKeyBasic }}>
      {children}
    </GhanaNLPContext.Provider>
  );
};

export const useGhanaNLP = (): GhanaNLPContextType => {
  const context = useContext(GhanaNLPContext);
  if (context === undefined) {
    throw new Error('useGhanaNLP must be used within a GhanaNLPProvider');
  }
  return context;
};
