
'use server';
/**
 * @fileOverview A Genkit flow to handle audio transcription.
 *
 * This flow takes raw audio data as a data URI, converts it to a WAV format,
 * sends it to the GhanaNLP transcription API, and returns the transcribed text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { PassThrough } from 'stream';

// Input Schema
const TranscribeAudioInputSchema = z.object({
  audioDataUri: z.string().describe(
    "A chunk of audio data as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  language: z.string().describe('The language code for transcription (e.g., "tw").'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

// Output Schema
const TranscribeAudioOutputSchema = z.object({
  success: z.boolean(),
  transcription: z.string().optional(),
  error: z.string().optional(),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

// Helper function to decode Data URI
const decodeDataUri = (dataUri: string) => {
  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid Data URI format.');
  }
  const [, mimeType, base64Data] = match;
  return { mimeType, buffer: Buffer.from(base64Data, 'base64') };
};

// Main exported function for client use
export async function transcribeAudioFlow(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudio(input);
}

// The Genkit Flow
const transcribeAudio = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GHANANLP_API_KEY_BASIC;
      if (!apiKey) {
        throw new Error('GhanaNLP API Key (basic) is not configured on the server.');
      }

      // We decode the incoming audio, but we don't need to convert it to WAV
      // because the API seems to handle the webm/ogg format from the browser directly.
      // If conversion were needed, the logic would be here.
      const { buffer } = decodeDataUri(input.audioDataUri);

      const formData = new FormData();
      // The API expects a file. We create a Blob from the buffer.
      const audioBlob = new Blob([buffer]);
      formData.append('file', audioBlob, 'recording.webm'); // Let's assume webm, a common format.

      const apiUrl = `https://translation-api.ghananlp.org/asr/v1/transcribe?language=${input.language}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
      }
      
      const resultText = await response.text();
      
      return { success: true, transcription: resultText };
    } catch (err: any) {
      console.error('[transcribeAudioFlow] Error:', err);
      return { success: false, error: err.message || 'An unknown error occurred during transcription.' };
    }
  }
);
