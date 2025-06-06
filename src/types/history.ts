
import type { Timestamp } from 'firebase/firestore';

export interface BaseHistoryEntry {
  id: string; // Firestore document ID
  userId: string;
  timestamp: Timestamp;
}

export interface TextTranslationHistoryEntry extends BaseHistoryEntry {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface VoiceToTextHistoryEntry extends BaseHistoryEntry {
  recognizedSpeech: string;
  detectedLanguage: string;
}

export interface TextToSpeechHistoryEntry extends BaseHistoryEntry {
  spokenText: string;
  selectedLanguage: string;
  speakerId?: string;
}

export interface TextSummaryHistoryEntry extends BaseHistoryEntry {
  originalText: string;
  summarizedText: string;
  language: string; // Language of the original text
}

// Union type for convenience if needed, though typically handled per tab
export type AnyHistoryEntry = 
  | TextTranslationHistoryEntry 
  | VoiceToTextHistoryEntry 
  | TextToSpeechHistoryEntry
  | TextSummaryHistoryEntry;
