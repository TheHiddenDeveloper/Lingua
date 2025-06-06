
'use client';

import { useState, useEffect, useCallback } from 'react';
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

type HistoryTab = 'translations' | 'summaries' | 'vot' | 'tts';

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoryTab>('translations');
  
  const [historyItems, setHistoryItems] = useState<AnyHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!user || authLoading) return;
    setIsLoadingHistory(true); setError(null);
    try {
      const collectionName = getCollectionName(tab);
      const historyCollectionRef = collection(db, `userHistories/${user.uid}/${collectionName}`);
      let q;
      if (loadMore && lastVisibleDoc) {
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), startAfter(lastVisibleDoc), limit(PAGE_SIZE));
      } else {
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
        setHistoryItems([]); 
      }
      const querySnapshot = await getDocs(q);
      const newItems = querySnapshot.docs.map(doc => ({ id: doc.id, userId: user.uid, ...doc.data(), timestamp: doc.data().timestamp as FirestoreTimestamp } as AnyHistoryEntry));
      setHistoryItems(prev => loadMore ? [...prev, ...newItems] : newItems);
      setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(newItems.length === PAGE_SIZE);
    } catch (err: any) {
      console.error(`Error fetching ${tab} history:`, err);
      setError(`Failed to load ${tab} history. ${err.message}`);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user, authLoading, lastVisibleDoc]);

  useEffect(() => {
    if (user && !authLoading) { setLastVisibleDoc(null); setHasMore(true); fetchHistory(activeTab); }
  }, [user, authLoading, activeTab, fetchHistory]); 

  const handleTabChange = (value: string) => { setActiveTab(value as HistoryTab); };
  const handleLoadMore = () => { if (hasMore && !isLoadingHistory) fetchHistory(activeTab, true); };

  const renderHistoryItem = (item: AnyHistoryEntry) => {
    const timeAgo = item.timestamp ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true }) : 'unknown time';
    switch (activeTab) {
      case 'translations':
        const transItem = item as TextTranslationHistoryEntry;
        return (
          <Card key={item.id} className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6"><CardTitle className="text-sm sm:text-base">Translation</CardTitle><CardDescription className="text-xs">{timeAgo}</CardDescription></CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1 px-4 sm:px-6 pb-4">
              <p><strong>From ({transItem.sourceLanguage}):</strong> {transItem.originalText}</p>
              <p><strong>To ({transItem.targetLanguage}):</strong> {transItem.translatedText}</p>
            </CardContent>
          </Card>
        );
      case 'summaries':
        const summaryItem = item as TextSummaryHistoryEntry;
        return (
          <Card key={item.id} className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6"><CardTitle className="text-sm sm:text-base">Summary ({summaryItem.language})</CardTitle><CardDescription className="text-xs">{timeAgo}</CardDescription></CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-2 px-4 sm:px-6 pb-4">
              <div><p className="font-semibold">Original:</p><ScrollArea className="h-20 rounded-md border p-2 bg-muted/20 mt-1"><p className="whitespace-pre-wrap text-xs">{summaryItem.originalText}</p></ScrollArea></div>
              <div><p className="font-semibold mt-1">Summary:</p><ScrollArea className="h-20 rounded-md border p-2 bg-muted/20 mt-1"><p className="whitespace-pre-wrap text-xs">{summaryItem.summarizedText}</p></ScrollArea></div>
            </CardContent>
          </Card>
        );
      case 'vot':
        const votItem = item as VoiceToTextHistoryEntry;
        return (
          <Card key={item.id} className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6"><CardTitle className="text-sm sm:text-base">Voice-to-Text ({votItem.detectedLanguage})</CardTitle><CardDescription className="text-xs">{timeAgo}</CardDescription></CardHeader>
            <CardContent className="text-xs sm:text-sm px-4 sm:px-6 pb-4"><p>"{votItem.recognizedSpeech}"</p></CardContent>
          </Card>
        );
      case 'tts':
        const ttsItem = item as TextToSpeechHistoryEntry;
        return (
          <Card key={item.id} className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6"><CardTitle className="text-sm sm:text-base">Text-to-Speech ({ttsItem.selectedLanguage})</CardTitle><CardDescription className="text-xs">{timeAgo}</CardDescription></CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1 px-4 sm:px-6 pb-4">
              <p><strong>Text:</strong> {ttsItem.spokenText}</p>
              {ttsItem.speakerId && <p><strong>Speaker:</strong> {ttsItem.speakerId}</p>}
            </CardContent>
          </Card>
        );
      default: return null;
    }
  };

  if (authLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <div className="text-center p-4 md:p-8">Please log in to view your history.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="font-headline text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-center md:text-left">Activity History</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 md:mb-6">
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="summaries">Summaries</TabsTrigger>
          <TabsTrigger value="vot">Voice-to-Text</TabsTrigger>
          <TabsTrigger value="tts">Text-to-Speech</TabsTrigger>
        </TabsList>
        {error && (<Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
        {['translations', 'summaries', 'vot', 'tts'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue}>
            {isLoadingHistory && historyItems.length === 0 && <div className="text-center py-8"><LoadingSpinner /></div>}
            {!isLoadingHistory && historyItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No {tabValue === 'vot' ? 'voice-to-text' : tabValue === 'tts' ? 'text-to-speech' : tabValue} history found.</p>
            )}
            {historyItems.length > 0 && (<ScrollArea className="h-[calc(100vh-24rem)] sm:h-[calc(100vh-22rem)] pr-2 sm:pr-4">{historyItems.map(item => renderHistoryItem(item))}</ScrollArea>)}
            {hasMore && !isLoadingHistory && historyItems.length > 0 && (
              <div className="text-center mt-4 md:mt-6"><Button onClick={handleLoadMore} variant="outline">Load More</Button></div>
            )}
            {isLoadingHistory && historyItems.length > 0 && <div className="text-center py-4"><LoadingSpinner size="sm" /></div>}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
