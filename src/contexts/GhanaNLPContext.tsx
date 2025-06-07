
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

  // Start with DEV key as primary
  const [activeKey, setActiveKey] = useState<string | undefined>(apiKeyDev || apiKeyBasic); // Fallback to basic if dev is not set
  const [activeKeyType, setActiveKeyType] = useState<'basic' | 'dev'>(apiKeyDev ? 'dev' : 'basic');
  const [devKeyHasFailed, setDevKeyHasFailed] = useState(false);

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

    // If dev key previously failed and we are somehow trying dev again, force basic (if available)
    if (devKeyHasFailed && activeKeyType === 'dev' && apiKeyBasic) {
      currentKeyToUse = apiKeyBasic;
      currentKeyType = 'basic';
      if (!isRetryCall) setActiveKey(apiKeyBasic); 
      if (!isRetryCall) setActiveKeyType('basic');
    }
    
    try {
      const response = await _fetchWithKey(endpoint, options, currentKeyToUse, currentKeyType);
      if (response.status === 403) {
        if (currentKeyType === 'dev' && !devKeyHasFailed && apiKeyBasic) {
          // Dev key failed, try switching to basic key
          setDevKeyHasFailed(true);
          setActiveKey(apiKeyBasic);
          setActiveKeyType('basic');
          toast({
            title: 'API Key Switched',
            description: `Switched to basic API key due to an issue with the dev key. Retrying request...`,
            variant: 'default',
          });
          // Retry the request ONCE with the basic key
          return _fetchWithKey(endpoint, options, apiKeyBasic, 'basic');
        } else {
          // Dev key failed and no basic key, or basic key also failed (after dev failed)
          let errorMessage = `GhanaNLP API Error (${currentKeyType} key): Access Forbidden (403).`;
          if (currentKeyType === 'basic' && devKeyHasFailed) {
            errorMessage = `GhanaNLP API Error: Both dev and basic keys resulted in Access Forbidden (403).`;
          } else if (currentKeyType === 'dev' && !apiKeyBasic) {
            errorMessage = `GhanaNLP API Error (dev key): Access Forbidden (403). No basic key configured to fallback.`;
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
  }, [activeKey, activeKeyType, devKeyHasFailed, apiKeyBasic, apiKeyDev, toast]);


  useEffect(() => {
    // Ensure primary key is set correctly on mount if both exist
    if (apiKeyDev) {
        setActiveKey(apiKeyDev);
        setActiveKeyType('dev');
    } else if (apiKeyBasic) {
        setActiveKey(apiKeyBasic);
        setActiveKeyType('basic');
    }

    const loadInitialData = async () => {
      if (!apiKeyDev && !apiKeyBasic) { // Adjusted check
        setInitialDataError("No GhanaNLP API keys configured.");
        setIsLoadingInitialData(false);
        toast({ title: 'Configuration Error', description: 'GhanaNLP API keys are missing.', variant: 'destructive' });
        return;
      }
      setIsLoadingInitialData(true);
      setInitialDataError(null);
      try {
        // Fetch Languages
        // The fetchGhanaNLP will use the active key (dev by default, then basic if dev fails)
        const langResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages', {});
        const langData = await langResponse.json();
        const apiLangObject = langData.languages;
        const supportedApiLangCodes = apiLangObject && typeof apiLangObject === 'object' ? Object.keys(apiLangObject) : [];
        
        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => supportedApiLangCodes.includes(prdLang.code));
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0) {
            const apiLangsString = supportedApiLangsString.length > 0 ? supportedApiLangsString.join(', ') : 'none provided by API';
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

