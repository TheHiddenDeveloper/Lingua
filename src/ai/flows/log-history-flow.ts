
'use server';
/**
 * @fileOverview Genkit flows for logging user activities to Firestore.
 *
 * - logTextTranslation: Logs a text translation event.
 * - logVoiceToText: Logs a voice-to-text transcription event.
 * - logTextToSpeech: Logs a text-to-speech synthesis event.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb, adminTimestamp } from '@/lib/firebaseAdmin';

// Common input schema for user identification
const BaseHistoryInputSchema = z.object({
  userId: z.string().describe('The Firebase UID of the user.'),
});

// Schema for Text Translation logging
export const TextTranslationHistoryInputSchema = BaseHistoryInputSchema.extend({
  originalText: z.string().describe('The original text before translation.'),
  translatedText: z.string().describe('The translated text.'),
  sourceLanguage: z.string().describe('The source language code (e.g., "en").'),
  targetLanguage: z.string().describe('The target language code (e.g., "tw").'),
});
export type TextTranslationHistoryInput = z.infer<typeof TextTranslationHistoryInputSchema>;

// Schema for Voice-to-Text logging
export const VoiceToTextHistoryInputSchema = BaseHistoryInputSchema.extend({
  recognizedSpeech: z.string().describe('The text transcribed from speech.'),
  detectedLanguage: z.string().describe('The language detected or used for transcription (e.g., "tw").'),
});
export type VoiceToTextHistoryInput = z.infer<typeof VoiceToTextHistoryInputSchema>;

// Schema for Text-to-Speech logging
export const TextToSpeechHistoryInputSchema = BaseHistoryInputSchema.extend({
  spokenText: z.string().describe('The text that was synthesized into speech.'),
  selectedLanguage: z.string().describe('The language selected for speech synthesis (e.g., "tw").'),
  speakerId: z.string().optional().describe('The speaker ID used for synthesis, if applicable.'),
});
export type TextToSpeechHistoryInput = z.infer<typeof TextToSpeechHistoryInputSchema>;

const LogHistoryOutputSchema = z.object({
  success: z.boolean().describe('Whether the logging was successful.'),
  id: z.string().optional().describe('The ID of the logged Firestore document.'),
  error: z.string().optional().describe('Error message if logging failed.'),
});
export type LogHistoryOutput = z.infer<typeof LogHistoryOutputSchema>;


// Flow to log text translation
export const logTextTranslationFlow = ai.defineFlow(
  {
    name: 'logTextTranslationFlow',
    inputSchema: TextTranslationHistoryInputSchema,
    outputSchema: LogHistoryOutputSchema,
  },
  async (input) => {
    try {
      const { userId, ...data } = input;
      const docRef = await adminDb
        .collection('userHistories')
        .doc(userId)
        .collection('textTranslations')
        .add({
          ...data,
          timestamp: adminTimestamp(),
        });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error logging text translation:', error);
      return { success: false, error: error.message || 'Failed to log text translation.' };
    }
  }
);
export async function logTextTranslation(input: TextTranslationHistoryInput): Promise<LogHistoryOutput> {
  return logTextTranslationFlow(input);
}


// Flow to log voice-to-text
export const logVoiceToTextFlow = ai.defineFlow(
  {
    name: 'logVoiceToTextFlow',
    inputSchema: VoiceToTextHistoryInputSchema,
    outputSchema: LogHistoryOutputSchema,
  },
  async (input) => {
    try {
      const { userId, ...data } = input;
      const docRef = await adminDb
        .collection('userHistories')
        .doc(userId)
        .collection('voiceToText')
        .add({
          ...data,
          timestamp: adminTimestamp(),
        });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error logging voice-to-text:', error);
      return { success: false, error: error.message || 'Failed to log voice-to-text.' };
    }
  }
);
export async function logVoiceToText(input: VoiceToTextHistoryInput): Promise<LogHistoryOutput> {
  return logVoiceToTextFlow(input);
}

// Flow to log text-to-speech
export const logTextToSpeechFlow = ai.defineFlow(
  {
    name: 'logTextToSpeechFlow',
    inputSchema: TextToSpeechHistoryInputSchema,
    outputSchema: LogHistoryOutputSchema,
  },
  async (input) => {
    try {
      const { userId, ...data } = input;
      const docRef = await adminDb
        .collection('userHistories')
        .doc(userId)
        .collection('textToSpeech')
        .add({
          ...data,
          timestamp: adminTimestamp(),
        });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error logging text-to-speech:', error);
      return { success: false, error: error.message || 'Failed to log text-to-speech.' };
    }
  }
);
export async function logTextToSpeech(input: TextToSpeechHistoryInput): Promise<LogHistoryOutput> {
  return logTextToSpeechFlow(input);
}
