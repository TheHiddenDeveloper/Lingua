
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiLanguage {
  code: string;
  name: string;
  apiName: string; // Name used by GhanaNLP API if different from display name
}

interface ApiSpeakersData {
  [key: string]: string[]; // e.g., { "Twi": ["speaker1", "speaker2"], "Ewe": ["speakerA"] }
}

interface GhanaNLPContextType {
  languages: ApiLanguage[];
  speakers: ApiSpeakersData | null;
  isLoadingInitialData: boolean;
  initialDataError: string | null;
  fetchGhanaNLP: (endpoint: string, options: RequestInit, isRetry?: boolean) => Promise<Response>;
  getApiKeyDev: () => string | undefined;
  getApiKeyBasic: () => string | undefined;
  activeKeyType: 'basic' | 'dev';
}

const GhanaNLPContext = createContext<GhanaNLPContextType | undefined>(undefined);

// Languages the PRD specifies are supported by the app for TTS
const PRD_LANGUAGES_SUPPORTED_BY_TTS: ApiLanguage[] = [
  { code: 'tw', name: 'Twi', apiName: 'Twi' },
  { code: 'ee', name: 'Ewe', apiName: 'Ewe' },
];

export const GhanaNLPProvider = ({ children }: { children: ReactNode }) => {
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [speakers, setSpeakers] = useState<ApiSpeakersData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);
  
  const apiKeyBasic = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_BASIC;
  const apiKeyDev = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_DEV;

  const [activeKey, setActiveKey] = useState<string | undefined>(apiKeyBasic);
  const [activeKeyType, setActiveKeyType] = useState<'basic' | 'dev'>('basic');
  const [basicKeyHasFailed, setBasicKeyHasFailed] = useState(false);

  const { toast } = useToast();

  const _fetchWithKey = async (url: string, options: RequestInit, keyToUse: string | undefined, keyType: 'basic' | 'dev'): Promise<Response> => {
    if (!keyToUse) {
      throw new Error(`GhanaNLP API Key (${keyType}) is not configured.`);
    }
    const headers = { ...options.headers, 'Ocp-Apim-Subscription-Key': keyToUse };
    return fetch(url, { ...options, headers });
  };

  const fetchGhanaNLP = useCallback(async (endpoint: string, options: RequestInit, isRetryCall: boolean = false): Promise<Response> => {
    let currentKeyToUse = activeKey;
    let currentKeyType = activeKeyType;

    if (basicKeyHasFailed && activeKeyType === 'basic' && apiKeyDev) {
      // If basic failed previously, and we are somehow trying basic again, force dev
      currentKeyToUse = apiKeyDev;
      currentKeyType = 'dev';
      if (!isRetryCall) setActiveKey(apiKeyDev); // Update global active key if not already dev
      if (!isRetryCall) setActiveKeyType('dev');
    }
    
    try {
      const response = await _fetchWithKey(endpoint, options, currentKeyToUse, currentKeyType);
      if (response.status === 403) {
        if (currentKeyType === 'basic' && !basicKeyHasFailed && apiKeyDev) {
          setBasicKeyHasFailed(true);
          setActiveKey(apiKeyDev);
          setActiveKeyType('dev');
          toast({
            title: 'API Key Switched',
            description: `Switched to dev API key due to an issue with the basic key. Retrying request...`,
            variant: 'default',
          });
          // Retry the request ONCE with the dev key
          return _fetchWithKey(endpoint, options, apiKeyDev, 'dev');
        } else {
          // Basic key failed and no dev key, or dev key also failed
          let errorMessage = `GhanaNLP API Error (${currentKeyType} key): Access Forbidden (403).`;
          if (currentKeyType === 'dev' && basicKeyHasFailed) {
            errorMessage = `GhanaNLP API Error: Both basic and dev keys resulted in Access Forbidden (403).`;
          } else if (currentKeyType === 'basic' && !apiKeyDev) {
            errorMessage = `GhanaNLP API Error (basic key): Access Forbidden (403). No dev key configured to fallback.`;
          }
          const error = new Error(errorMessage);
          (error as any).response = response; // Attach response for more details if needed
          throw error;
        }
      }
      if (!response.ok) {
         let errorResponseMessage = `GhanaNLP API Error: ${response.statusText} (Status: ${response.status})`;
         try { const errorData = await response.json(); if (errorData && errorData.message) errorResponseMessage = `GhanaNLP API Error: ${errorData.message}`; } catch (e) {/*ignore silently if not json*/}
         const error = new Error(errorResponseMessage);
         (error as any).response = response;
         throw error;
      }
      return response;
    } catch (error) {
      console.error('GhanaNLP Fetch Error:', error);
      throw error; // Re-throw to be handled by the calling component
    }
  }, [activeKey, activeKeyType, basicKeyHasFailed, apiKeyBasic, apiKeyDev, toast]);


  useEffect(() => {
    const loadInitialData = async () => {
      if (!apiKeyBasic && !apiKeyDev) {
        setInitialDataError("No GhanaNLP API keys configured.");
        setIsLoadingInitialData(false);
        toast({ title: 'Configuration Error', description: 'GhanaNLP API keys are missing.', variant: 'destructive' });
        return;
      }
      setIsLoadingInitialData(true);
      setInitialDataError(null);
      try {
        // Fetch Languages
        const langResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages', {});
        const langData = await langResponse.json();
        const apiLangObject = langData.languages;
        const supportedApiLangCodes = apiLangObject && typeof apiLangObject === 'object' ? Object.keys(apiLangObject) : [];
        
        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => supportedApiLangCodes.includes(prdLang.code));
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0) {
            const apiLangsString = supportedApiLangCodes.length > 0 ? supportedApiLangCodes.join(', ') : 'none provided by API';
            const langErrorMessage = `App requires Twi/Ewe for TTS. API reported supporting: [${apiLangsString}]. Check key/permissions.`;
            setInitialDataError(langErrorMessage); // Set error but continue to fetch speakers
            toast({ title: 'Language Config Issue', description: langErrorMessage, variant: 'warning', duration: 10000 });
        }
        
        // Fetch Speakers
        const speakerResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/speakers', {});
        const speakerData = await speakerResponse.json();
        setSpeakers(speakerData.speakers || {});

      } catch (err: any) {
        setInitialDataError(err.message || "Failed to load initial TTS data.");
        toast({ title: 'API Error', description: `Could not load initial TTS data: ${err.message}`, variant: 'destructive' });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    loadInitialData();
  }, [fetchGhanaNLP, apiKeyBasic, apiKeyDev, toast]);


  const getApiKeyDev = () => apiKeyDev;
  const getApiKeyBasic = () => apiKeyBasic;

  return (
    <GhanaNLPContext.Provider value={{ languages, speakers, isLoadingInitialData, initialDataError, fetchGhanaNLP, getApiKeyDev, getApiKeyBasic, activeKeyType }}>
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
