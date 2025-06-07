
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
  const apiKeyDev = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_DEV;
  const apiKeyBasic = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_BASIC;

  const [activeKeyType, setActiveKeyType] = useState<'basic' | 'dev'>(() => {
    return apiKeyDev ? 'dev' : 'basic';
  });
  const [activeKey, setActiveKey] = useState<string | undefined>(() => {
    return apiKeyDev || apiKeyBasic;
  });
  const [devKeyHasFailed, setDevKeyHasFailed] = useState(false);
  
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [speakers, setSpeakers] = useState<ApiSpeakersData | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const _fetchWithKey = async (url: string, options: RequestInit, keyToUse: string | undefined, keyTypeForError: 'basic' | 'dev'): Promise<Response> => {
    if (!keyToUse) {
      throw new Error(`GhanaNLP API Key (${keyTypeForError}) is not configured.`);
    }
    const headers = { ...(options.headers || {}), 'Ocp-Apim-Subscription-Key': keyToUse };
    return fetch(url, { ...options, headers });
  };

  const fetchGhanaNLP = useCallback(async (endpoint: string, options: RequestInit, isRetryCall: boolean = false): Promise<Response> => {
    let currentKeyToUse = activeKey;
    let currentKeyType = activeKeyType;
    
    try {
      const response = await _fetchWithKey(endpoint, options, currentKeyToUse, currentKeyType);
      if (response.status === 403) {
        if (currentKeyType === 'dev' && !devKeyHasFailed && apiKeyBasic) {
          setDevKeyHasFailed(true);
          setActiveKey(apiKeyBasic);
          setActiveKeyType('basic');
          if (!isRetryCall) { // Avoid double toast if this is part of an internal retry within loadInitialData
            toast({
              title: 'API Key Switched',
              description: `Switched to basic API key due to an issue with the dev key. Retrying request...`,
              variant: 'default',
            });
          }
          // Retry the request ONCE with the basic key
          return _fetchWithKey(endpoint, options, apiKeyBasic, 'basic');
        } else {
          let errorMessage = `GhanaNLP API Error (${currentKeyType} key): Access Forbidden (403).`;
          if (currentKeyType === 'basic' && devKeyHasFailed) {
            errorMessage = `GhanaNLP API Error: Both dev and basic keys resulted in Access Forbidden (403). Check API key validity and permissions.`;
          } else if (currentKeyType === 'dev' && !apiKeyBasic) {
            errorMessage = `GhanaNLP API Error (dev key): Access Forbidden (403). No basic key configured to fallback.`;
          }
          const error = new Error(errorMessage);
          (error as any).response = response;
          throw error;
        }
      }
      if (!response.ok) {
         let errorResponseMessage = `GhanaNLP API Error: ${response.statusText} (Status: ${response.status})`;
         try { 
            const errorDataText = await response.text();
            // Try to parse as JSON, but fallback to text if not JSON
            try {
                const errorDataJson = JSON.parse(errorDataText);
                if (errorDataJson && (errorDataJson.message || errorDataJson.detail) ) {
                    errorResponseMessage = `GhanaNLP API Error: ${errorDataJson.message || errorDataJson.detail}`;
                } else if (errorDataText) {
                    errorResponseMessage = `GhanaNLP API Error (${response.status}): ${errorDataText}`;
                }
            } catch (e) {
                if (errorDataText) { // If not JSON, use the raw text
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
  }, [activeKey, activeKeyType, devKeyHasFailed, apiKeyBasic, apiKeyDev, toast]);


  useEffect(() => {
    const loadInitialData = async () => {
      if (!activeKey) { 
        setInitialDataError("No GhanaNLP API keys configured. Please set NEXT_PUBLIC_GHANANLP_API_KEY_DEV or NEXT_PUBLIC_GHANANLP_API_KEY_BASIC in your environment.");
        setIsLoadingInitialData(false);
        toast({ title: 'Configuration Error', description: 'GhanaNLP API keys are missing.', variant: 'destructive' });
        return;
      }

      setIsLoadingInitialData(true);
      setInitialDataError(null);
      let localDevKeyFailed = devKeyHasFailed; // Use a local copy for this effect's logic

      try {
        let langData, speakerData;
        try {
            const langResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages', {}, localDevKeyFailed);
            langData = await langResponse.json();
        } catch (langError: any) {
            // If the first call (dev key) failed and we switched to basic, devKeyHasFailed state is now true.
            // The fetchGhanaNLP handles the retry for us if dev key fails and basic is available.
            // So, if an error still bubbles up here, it means both keys failed or only one was configured and failed.
            throw langError; // Re-throw to be caught by the outer try-catch
        }
        
        // After a potential key swap in the first call, `devKeyHasFailed` state might be updated.
        // Use the current `devKeyHasFailed` state for the subsequent call.
        const currentDevKeyFailedStatus = devKeyHasFailed; 

        try {
            const speakerResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/speakers', {}, currentDevKeyFailedStatus);
            speakerData = await speakerResponse.json();
        } catch (speakerError: any) {
            throw speakerError;
        }

        const apiLangObject = langData.languages;
        const supportedApiLangCodes = apiLangObject && typeof apiLangObject === 'object' ? Object.keys(apiLangObject) : [];
        
        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => supportedApiLangCodes.includes(prdLang.apiName)); // Use apiName for matching
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0 && PRD_LANGUAGES_SUPPORTED_BY_TTS.length > 0) {
            const prdLangNames = PRD_LANGUAGES_SUPPORTED_BY_TTS.map(l => l.name).join('/');
            const apiLangsString = supportedApiLangCodes.length > 0 ? supportedApiLangCodes.join(', ') : 'none reported by API';
            const langErrorMessage = `App requires ${prdLangNames} for TTS. API reported supporting: [${apiLangsString}]. Check key validity/permissions or language codes.`;
            setInitialDataError(langErrorMessage);
            toast({ title: 'Language Config Issue', description: langErrorMessage, variant: 'warning', duration: 10000 });
        }
        
        setSpeakers(speakerData.speakers || {});

      } catch (err: any) {
        setInitialDataError(err.message || "Failed to load initial TTS options (languages/speakers).");
        // Toast for this error is handled by fetchGhanaNLP or the general toast below
        if (!err.message?.includes("Access Forbidden")) { // Avoid double toast for 403s handled by fetchGhanaNLP
             toast({ title: 'API Error', description: `Could not load initial TTS options: ${err.message}`, variant: 'destructive' });
        }
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, toast]); // Depends on activeKey to re-run if the key changes (e.g. after a successful swap for retry)
                           // Toast is stable. apiKeyDev/Basic are constant after mount.

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

