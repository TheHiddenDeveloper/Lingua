
'use server';
/**
 * @fileOverview Genkit flows to proxy requests for TTS options from the GhanaNLP API.
 * This is necessary to avoid client-side CORS issues.
 *
 * - getTtsLanguages: Fetches the available languages for Text-to-Speech.
 * - getTtsSpeakers: Fetches the available speakers for Text-to-Speech.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas for consistent input/output, though they are empty for these GET requests.
const EmptyInputSchema = z.object({});
const LanguagesOutputSchema = z.any(); // We'll let the raw JSON pass through
const SpeakersOutputSchema = z.any(); // We'll let the raw JSON pass through

async function fetchFromGhanaNLP(endpoint: string) {
  const apiKey = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_BASIC;
  if (!apiKey) {
    throw new Error('GhanaNLP API Key is not configured on the server.');
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GhanaNLP API Error (${response.status}): ${errorText || response.statusText}`);
  }

  return await response.json();
}

// Flow to get TTS languages
const getTtsLanguagesFlow = ai.defineFlow(
  {
    name: 'getTtsLanguagesFlow',
    inputSchema: EmptyInputSchema,
    outputSchema: LanguagesOutputSchema,
  },
  async () => {
    console.log('[getTtsLanguagesFlow] Fetching TTS languages from GhanaNLP API.');
    return await fetchFromGhanaNLP('https://translation-api.ghananlp.org/tts/v1/languages');
  }
);
export async function getTtsLanguages(): Promise<any> {
  return getTtsLanguagesFlow({});
}

// Flow to get TTS speakers
const getTtsSpeakersFlow = ai.defineFlow(
  {
    name: 'getTtsSpeakersFlow',
    inputSchema: EmptyInputSchema,
    outputSchema: SpeakersOutputSchema,
  },
  async () => {
    console.log('[getTtsSpeakersFlow] Fetching TTS speakers from GhanaNLP API.');
    return await fetchFromGhanaNLP('https://translation-api.ghananlp.org/tts/v1/speakers');
  }
);
export async function getTtsSpeakers(): Promise<any> {
  return getTtsSpeakersFlow({});
}
