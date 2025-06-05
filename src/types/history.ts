
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

// Union type for convenience if needed, though typically handled per tab
export type AnyHistoryEntry = TextTranslationHistoryEntry | VoiceToTextHistoryEntry | TextToSpeechHistoryEntry;
