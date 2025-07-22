
'use client';

import { useState, useEffect, useCallback, type Key } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, type DocumentData, type QueryDocumentSnapshot, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TextTranslationHistoryEntry, VoiceToTextHistoryEntry, TextToSpeechHistoryEntry, TextSummaryHistoryEntry, type AnyHistoryEntry } from '@/types/history';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History as HistoryIcon } from 'lucide-react';

type HistoryTab = 'translations' | 'summaries' | 'vot' | 'tts';

const PAGE_SIZE = 10;

interface HistoryState {
  items: AnyHistoryEntry[];
  isLoading: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  error: string | null;
}

const initialHistoryState: HistoryState = {
  items: [],
  isLoading: true,
  lastDoc: null,
  hasMore: true,
  error: null,
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoryTab>('translations');
  
  const [historyState, setHistoryState] = useState<Record<HistoryTab, HistoryState>>({
    translations: { ...initialHistoryState },
    summaries: { ...initialHistoryState },
    vot: { ...initialHistoryState },
    tts: { ...initialHistoryState },
  });

  const getCollectionName = (tab: HistoryTab): string => {
    switch (tab) {
      case 'translations': return 'textTranslations';
      case 'summaries': return 'textSummaries';
      case 'vot': return 'voiceToText';
      case 'tts': return 'textToSpeech';
      default: throw new Error('Invalid history tab');
    }
  };

  const fetchHistory = useCallback(async (tab: HistoryTab, loadMore = false) => {
    if (!user) return;
    
    console.log(`[History] Fetching data for tab: ${tab}, Load More: ${loadMore}`);

    setHistoryState(prev => ({
      ...prev,
      [tab]: { ...prev[tab], isLoading: true, error: null }
    }));

    try {
      const collectionName = getCollectionName(tab);
      const historyCollectionRef = collection(db, `userHistories/${user.uid}/${collectionName}`);
      
      const currentLastDoc = loadMore ? historyState[tab].lastDoc : null;
      let q;

      if (currentLastDoc) {
        console.log(`[History] Querying more for ${tab} starting after doc:`, currentLastDoc.id);
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), startAfter(currentLastDoc), limit(PAGE_SIZE));
      } else {
        console.log(`[History] Querying initial data for ${tab}`);
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
      }

      const querySnapshot = await getDocs(q);
      const newItems: AnyHistoryEntry[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          userId: user.uid, 
          ...data, 
          timestamp: data.timestamp as FirestoreTimestamp 
        } as AnyHistoryEntry;
      });

      console.log(`[History] Fetched ${newItems.length} new items for ${tab}.`);

      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      setHistoryState(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          items: loadMore ? [...prev[tab].items, ...newItems] : newItems,
          lastDoc: lastVisibleDoc,
          hasMore: newItems.length === PAGE_SIZE,
          isLoading: false,
        }
      }));

    } catch (err: any) {
      console.error(`[History] Error fetching ${tab} history:`, err);
      setHistoryState(prev => ({
        ...prev,
        [tab]: { ...prev[tab], isLoading: false, error: `Failed to load ${tab} history. ${err.message}` }
      }));
    }
  }, [user, historyState]); // Intentionally keeping historyState here to access lastDoc, but the logic inside `useEffect` will prevent the loop.

  useEffect(() => {
    if (user && !authLoading) {
      // Fetch history for the active tab only if it hasn't been fetched yet
      if (historyState[activeTab].isLoading && historyState[activeTab].items.length === 0) {
        fetchHistory(activeTab, false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, activeTab]); // Removed fetchHistory from dependency array to break the loop.

  const handleTabChange = (value: string) => {
    const newTab = value as HistoryTab;
    setActiveTab(newTab);
    // Trigger fetch for the new tab if it's in its initial state
    if (user && historyState[newTab].items.length === 0 && historyState[newTab].hasMore) {
        fetchHistory(newTab, false);
    }
  };
  
  const handleLoadMore = () => {
    if (!historyState[activeTab].isLoading && historyState[activeTab].hasMore) {
      fetchHistory(activeTab, true);
    }
  };

  const renderHistoryItem = (item: AnyHistoryEntry, tab: HistoryTab) => {
    const timeAgo = item.timestamp ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true }) : 'unknown time';
    const key = `${tab}-${item.id}` as Key;

    switch (tab) {
      case 'translations':
        const transItem = item as TextTranslationHistoryEntry;
        return (
          <div key={key} className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-base">Translation</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <div className="text-sm space-y-2">
              <p><strong className="text-muted-foreground">From ({transItem.sourceLanguage}):</strong> {transItem.originalText}</p>
              <p><strong className="text-muted-foreground">To ({transItem.targetLanguage}):</strong> {transItem.translatedText}</p>
            </div>
          </div>
        );
      case 'summaries':
        const summaryItem = item as TextSummaryHistoryEntry;
        return (
          <div key={key} className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-base">Summary ({summaryItem.language})</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <div className="text-sm space-y-3">
              <div><p className="font-medium mb-1">Original:</p><ScrollArea className="h-24 rounded-md border bg-muted/30 p-2"><p className="whitespace-pre-wrap text-xs">{summaryItem.originalText}</p></ScrollArea></div>
              <div><p className="font-medium mb-1">Summary:</p><ScrollArea className="h-24 rounded-md border bg-muted/30 p-2"><p className="whitespace-pre-wrap text-xs">{summaryItem.summarizedText}</p></ScrollArea></div>
            </div>
          </div>
        );
      case 'vot':
        const votItem = item as VoiceToTextHistoryEntry;
        return (
          <div key={key} className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-base">Voice-to-Text ({votItem.detectedLanguage})</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <p className="text-sm italic">&quot;{votItem.recognizedSpeech}&quot;</p>
          </div>
        );
      case 'tts':
        const ttsItem = item as TextToSpeechHistoryEntry;
        return (
          <div key={key} className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-base">Text-to-Speech ({ttsItem.selectedLanguage})</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <div className="text-sm space-y-1">
              <p><strong className="text-muted-foreground">Text:</strong> {ttsItem.spokenText}</p>
              {ttsItem.speakerId && <p><strong className="text-muted-foreground">Speaker:</strong> {ttsItem.speakerId}</p>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderTabContent = (tab: HistoryTab) => {
    const { items, isLoading, hasMore, error } = historyState[tab];
    const tabNameMapping = {
        translations: 'translation',
        summaries: 'summary',
        vot: 'voice-to-text',
        tts: 'text-to-speech',
    };

    if (isLoading && items.length === 0) {
      return <div className="text-center py-8"><LoadingSpinner /></div>;
    }
    if (error) {
      return <Alert variant="destructive" className="my-4 px-4 sm:px-6 py-3"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
    if (items.length === 0) {
      return <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">No {tabNameMapping[tab]} history found.</p>;
    }

    return (
      <div className="space-y-4">
        <div>
          {items.map(item => renderHistoryItem(item, tab))}
        </div>
        {hasMore && (
          <div className="text-center mt-4 md:mt-6">
            <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm"/> : 'Load More'}
            </Button>
          </div>
        )}
        {isLoading && items.length > 0 && <div className="text-center py-4"><LoadingSpinner size="sm" /></div>}
      </div>
    );
  };

  if (authLoading) return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner size="lg" /></div>;
  if (!user) return <div className="text-center p-4 md:p-8">Please log in to view your history.</div>;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="text-center md:text-left mb-2 md:mb-4">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start">
          <HistoryIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary" />
          Activity History
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review your past activities.</p>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
          <TabsTrigger value="translations" className="text-xs sm:text-sm py-1.5 sm:py-2">Translations</TabsTrigger>
          <TabsTrigger value="summaries" className="text-xs sm:text-sm py-1.5 sm:py-2">Summaries</TabsTrigger>
          <TabsTrigger value="vot" className="text-xs sm:text-sm py-1.5 sm:py-2">Voice-to-Text</TabsTrigger>
          <TabsTrigger value="tts" className="text-xs sm:text-sm py-1.5 sm:py-2">Text-to-Speech</TabsTrigger>
        </TabsList>
        <div className="mt-4">
            <TabsContent value="translations" forceMount={activeTab === 'translations' ? undefined : true} hidden={activeTab !== 'translations'}>{renderTabContent('translations')}</TabsContent>
            <TabsContent value="summaries" forceMount={activeTab === 'summaries' ? undefined : true} hidden={activeTab !== 'summaries'}>{renderTabContent('summaries')}</TabsContent>
            <TabsContent value="vot" forceMount={activeTab === 'vot' ? undefined : true} hidden={activeTab !== 'vot'}>{renderTabContent('vot')}</TabsContent>
            <TabsContent value="tts" forceMount={activeTab === 'tts' ? undefined : true} hidden={activeTab !== 'tts'}>{renderTabContent('tts')}</TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
