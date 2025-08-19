
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTtsLanguages, getTtsSpeakers } from '@/ai/flows/tts-options-flow';

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
      // This fetch is for direct API calls from other components, not for initial data loading.
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
      setIsLoadingInitialData(true);
      setInitialDataError(null);

      let langData: any = null;
      let speakerData: any = null;

      try {
        // Call the server-side Genkit flows instead of fetching directly
        langData = await getTtsLanguages();
        speakerData = await getTtsSpeakers();

        const apiLanguages = langData.languages || (Array.isArray(langData) ? langData : []);
        const supportedApiLangCodes = Array.isArray(apiLanguages) 
          ? apiLanguages.map((lang: any) => (lang.code || lang.name || lang.language || '').toLowerCase()).filter(Boolean) 
          : [];

        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => 
          supportedApiLangCodes.includes(prdLang.apiName.toLowerCase())
        );
        
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0 && PRD_LANGUAGES_SUPPORTED_BY_TTS.length > 0) {
            const prdLangNames = PRD_LANGUAGES_SUPPORTED_BY_TTS.map(l => l.name).join('/');
            const supportedFromApi = supportedApiLangCodes.join(', ') || '[none reported by API]';
            const langErrorMessage = `App requires ${prdLangNames} for TTS. API reported supporting: ${supportedFromApi}. Check key validity/permissions or language codes. Ensure 'apiName' in PRD_LANGUAGES_SUPPORTED_BY_TTS matches API codes.`;
            setInitialDataError(langErrorMessage);
            const rawDataForError = `\n--- Raw Language Data ---\n${JSON.stringify(langData, null, 2)}\n--- Raw Speaker Data ---\n${JSON.stringify(speakerData, null, 2)}`;
            console.error(langErrorMessage, rawDataForError);
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
        const rawDataForError = `\n--- Raw Language Data ---\n${JSON.stringify(langData, null, 2)}\n--- Raw Speaker Data ---\n${JSON.stringify(speakerData, null, 2)}`;
        const errorMessage = (err.message || "Failed to load initial TTS options from the server.") + rawDataForError;
        setInitialDataError(errorMessage);
        console.error(errorMessage);
        toast({ title: 'API Error', description: `Could not load initial TTS options. Check console for details.`, variant: 'destructive' });
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

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
