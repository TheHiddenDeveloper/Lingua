
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Copy, Share2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generateTextSummary, type GenerateTextSummaryInput, type GenerateTextSummaryOutput } from '@/ai/flows/generate-text-summary-flow';
import { logTextSummary } from '@/ai/flows/log-history-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'tw', name: 'Twi' },
  { code: 'ga', name: 'Ga' },
  { code: 'dag', name: 'Dagbani' },
  { code: 'ee', name: 'Ewe' },
];

const MAX_INPUT_LENGTH = 5000;

export default function SummaryPage() {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const handleSummarize = async () => {
    if (!inputText.trim()) { toast({ title: 'Input Required', description: 'Please enter text to summarize.', variant: 'destructive' }); return; }
    if (inputText.length > MAX_INPUT_LENGTH) { toast({ title: 'Input Too Long', description: `Input text must be ${MAX_INPUT_LENGTH} characters or less.`, variant: 'destructive' }); return; }
    if (!user) { toast({ title: 'Authentication Error', description: 'You must be logged in to summarize text.', variant: 'destructive' }); return; }

    setIsLoading(true); setError(null); setSummary('');
    try {
      const languageName = supportedLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage;
      const input: GenerateTextSummaryInput = { text: inputText, language: languageName };
      const result: GenerateTextSummaryOutput = await generateTextSummary(input);
      setSummary(result.summary);
      toast({ title: 'Summary Generated', description: 'Text summarized successfully.' });
      if (user.uid && result.summary) { logTextSummary({ userId: user.uid, originalText: inputText, summarizedText: result.summary, language: languageName }).then(logResult => { if (!logResult.success) { console.warn('Failed to log summary to history (server-side):', logResult.error); toast({ title: 'History Logging Failed', description: `Could not save summary to history: ${logResult.error || 'Unknown error'}`, variant: 'destructive'}); } }).catch (logError => { console.error("Client-side error calling logTextSummary flow:", logError); toast({ title: 'History Logging Error', description: `Error trying to save summary to history: ${logError.message || 'Unknown error'}`, variant: 'destructive'}); }); }
    } catch (err: any) { console.error("Summarization error:", err); let displayMessage = err.message || 'Failed to generate summary.'; if (err.message && err.message.includes('model response was blocked')) { displayMessage = 'The AI model blocked the response, possibly due to safety filters. Please try modifying your input text.'; } else if (err.message && (err.message.includes('API key not valid') || err.message.includes('API_KEY_INVALID'))) { displayMessage = 'The AI service API key is not configured correctly or is invalid. Please check the setup.'; } setError(displayMessage); toast({ title: 'Summarization Error', description: displayMessage, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleCopySummary = () => { if (!summary) return; navigator.clipboard.writeText(summary).then(() => toast({ title: 'Copied!', description: 'Summary copied to clipboard.' })).catch(err => toast({ title: 'Copy Failed', description: 'Could not copy summary.', variant: 'destructive' })); };
  const handleShareSummary = async () => { if (!summary) return; if (navigator.share) { try { await navigator.share({ title: 'Text Summary', text: summary }); } catch (err: any) { if (err.name !== 'AbortError') { toast({ title: 'Share Failed', description: 'Could not share summary.', variant: 'destructive' }); } } } else { toast({ title: 'Share Not Supported', description: 'Your browser does not support direct sharing. Please copy the summary manually.', variant: 'destructive' }); } };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="text-center">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold">AI Text Summarizer</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm sm:text-base">Get concise summaries of your long-form text content.</p>
      </div>

      {error && ( <Alert variant="destructive" className="my-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Summarization Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="input-text-area" className="text-base font-medium">Your Text</Label>
           <p className="text-xs sm:text-sm text-muted-foreground mb-2">Enter your text, select its language, and click &quot;Summarize&quot;. Max {MAX_INPUT_LENGTH} characters.</p>
          <Textarea id="input-text-area" placeholder="Paste your article, essay, or transcript here..." value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-[150px] sm:min-h-[200px] text-base resize-y" aria-label="Input text for summarization" maxLength={MAX_INPUT_LENGTH} />
          <p className="text-xs text-muted-foreground mt-1 text-right">{inputText.length} / {MAX_INPUT_LENGTH}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="w-full sm:w-auto flex-grow sm:flex-grow-0">
            <Label htmlFor="language-select" className="block mb-1 text-sm font-medium">Language of Input Text:</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language-select" className="w-full sm:w-[200px]"><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>{supportedLanguages.map(lang => ( <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem> ))}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSummarize} disabled={isLoading || !inputText.trim()} size="lg" className="w-full sm:w-auto btn-animated mt-2 sm:mt-0 flex-shrink-0">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />} Summarize Text
          </Button>
        </div>
      </div>

      {(summary || isLoading) && (
        <div className="mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h2 className="font-headline text-lg sm:text-xl">Generated Summary</h2>
            {summary && (
                <div className="flex gap-2 self-start sm:self-auto">
                <Button variant="outline" size="icon" onClick={handleCopySummary} aria-label="Copy summary"><Copy className="h-4 w-4" /></Button>
                {typeof navigator !== 'undefined' && navigator.share && ( <Button variant="outline" size="icon" onClick={handleShareSummary} aria-label="Share summary"><Share2 className="h-4 w-4" /></Button> )}
                </div>
            )}
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            {isLoading && <p className="text-muted-foreground">Generating summary...</p>}
            {summary && !isLoading && (
                 <ScrollArea className="h-[150px] sm:h-[200px] w-full rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{summary}</p>
                </ScrollArea>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
