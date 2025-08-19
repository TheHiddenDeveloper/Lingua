
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-translation.ts';
import '@/ai/flows/log-history-flow.ts';
import '@/ai/flows/generate-text-summary-flow.ts';
import '@/ai/flows/transcribe-audio-flow.ts';
import '@/ai/flows/tts-options-flow.ts';
