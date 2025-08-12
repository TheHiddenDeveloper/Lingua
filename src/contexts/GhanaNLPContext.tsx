
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
  fetchGhanaNLP: (endpoint: string, options: RequestInit, isRetry?: boolean) => Promise<Response>;
  getApiKeyDev: () => string | undefined;
  getApiKeyBasic: () => string | undefined;
  activeKeyType: 'basic' | 'dev';
}

const GhanaNLPContext = createContext<GhanaNLPContextType | undefined>(undefined);

// Languages the PRD specifies are supported by the app for TTS
// Ensure apiName matches the keys returned by the GhanaNLP /languages endpoint (e.g., "tw", "ee")
const PRD_LANGUAGES_SUPPORTED_BY_TTS: ApiLanguage[] = [
  { code: 'tw', name: 'Twi', apiName: 'tw' },
  { code: 'ee', name: 'Ewe', apiName: 'ee' },
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
    
    // Prioritize dev key if available and hasn't failed
    if (apiKeyDev && !devKeyHasFailed) {
      currentKeyToUse = apiKeyDev;
      currentKeyType = 'dev';
    } else if (apiKeyBasic) {
      currentKeyToUse = apiKeyBasic;
      currentKeyType = 'basic';
    } else { // No keys configured or both tried and failed
        const keyErrorMsg = !apiKeyDev && !apiKeyBasic ? "No GhanaNLP API keys are configured." : "All configured GhanaNLP API keys have failed or are invalid.";
        const error = new Error(keyErrorMsg);
        (error as any).noKeys = true; // Custom flag
        throw error;
    }
    setActiveKey(currentKeyToUse); // Ensure activeKey state is current
    setActiveKeyType(currentKeyType);

    try {
      const response = await _fetchWithKey(endpoint, options, currentKeyToUse, currentKeyType);
      if (response.status === 403) {
        if (currentKeyType === 'dev' && apiKeyBasic) {
          setDevKeyHasFailed(true); // Mark dev key as failed for this session
          setActiveKey(apiKeyBasic); // Switch to basic key
          setActiveKeyType('basic');
          if (!isRetryCall) {
            toast({
              title: 'API Key Switched',
              description: `Dev key failed. Switched to basic API key. Retrying request...`,
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
  }, [activeKey, activeKeyType, devKeyHasFailed, apiKeyBasic, apiKeyDev, toast]);


  useEffect(() => {
    const loadInitialData = async () => {
      if (!apiKeyDev && !apiKeyBasic) { 
        setInitialDataError("No GhanaNLP API keys configured. Please set NEXT_PUBLIC_GHANANLP_API_KEY_DEV or NEXT_PUBLIC_GHANANLP_API_KEY_BASIC in your environment.");
        setIsLoadingInitialData(false);
        toast({ title: 'Configuration Error', description: 'GhanaNLP API keys are missing.', variant: 'destructive' });
        return;
      }

      setIsLoadingInitialData(true);
      setInitialDataError(null);

      try {
        const langResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages', {});
        const langData = await langResponse.json();
        
        const speakerResponse = await fetchGhanaNLP('https://translation-api.ghananlp.org/tts/v1/speakers', {});
        const speakerData = await speakerResponse.json();

        // FIX: The API returns an array of language objects, not an object of objects.
        const apiLanguages = langData.languages || [];
        const supportedApiLangCodes = Array.isArray(apiLanguages) ? apiLanguages.map((lang: any) => lang.code) : [];

        const filteredAppLanguages = PRD_LANGUAGES_SUPPORTED_BY_TTS.filter(prdLang => 
          supportedApiLangCodes.includes(prdLang.apiName)
        );
        setLanguages(filteredAppLanguages);

        if (filteredAppLanguages.length === 0 && PRD_LANGUAGES_SUPPORTED_BY_TTS.length > 0) {
            const prdLangNames = PRD_LANGUAGES_SUPPORTED_BY_TTS.map(l => l.name).join('/');
            const apiLangsString = supportedApiLangCodes.length > 0 ? supportedApiLangCodes.join(', ') : 'none reported by API';
            const langErrorMessage = `App requires ${prdLangNames} for TTS. API reported supporting: [${apiLangsString}]. Check key validity/permissions or language codes. Ensure 'apiName' in PRD_LANGUAGES_SUPPORTED_BY_TTS matches API codes.`;
            setInitialDataError(langErrorMessage);
            toast({ title: 'Language Config Issue', description: langErrorMessage, variant: 'warning', duration: 10000 });
        }
        
        const transformedSpeakers: ApiSpeakersData = {};
        if (speakerData.speakers && typeof speakerData.speakers === 'object') {
            for (const langApiNameFromSpeakersKey of Object.keys(speakerData.speakers)) {
                const appLangDef = PRD_LANGUAGES_SUPPORTED_BY_TTS.find(
                    l => l.name.toLowerCase() === langApiNameFromSpeakersKey.toLowerCase() || 
                         l.apiName.toLowerCase() === langApiNameFromSpeakersKey.toLowerCase()
                );
                if (appLangDef) {
                    transformedSpeakers[appLangDef.apiName] = speakerData.speakers[langApiNameFromSpeakersKey];
                }
            }
        }
        setSpeakers(transformedSpeakers);

      } catch (err: any) {
        if ((err as any).noKeys) {
             setInitialDataError(err.message);
        } else {
            setInitialDataError(err.message || "Failed to load initial TTS options (languages/speakers).");
        }
        if (!err.message?.includes("Access Forbidden") && !err.message?.includes("Switched to basic API key")) {
             toast({ title: 'API Error', description: `Could not load initial TTS options: ${err.message}`, variant: 'destructive' });
        }
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyDev, apiKeyBasic, toast]);

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
