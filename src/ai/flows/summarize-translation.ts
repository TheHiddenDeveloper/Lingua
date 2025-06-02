// Summarizes translations for quick understanding, particularly useful for language learners.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTranslationInputSchema = z.object({
  translation: z.string().describe('The translated text to summarize.'),
  language: z.string().describe('The language of the translated text.'),
});

export type SummarizeTranslationInput = z.infer<typeof SummarizeTranslationInputSchema>;

const SummarizeTranslationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the translated text.'),
});

export type SummarizeTranslationOutput = z.infer<typeof SummarizeTranslationOutputSchema>;

export async function summarizeTranslation(input: SummarizeTranslationInput): Promise<SummarizeTranslationOutput> {
  return summarizeTranslationFlow(input);
}

const summarizeTranslationPrompt = ai.definePrompt({
  name: 'summarizeTranslationPrompt',
  input: {schema: SummarizeTranslationInputSchema},
  output: {schema: SummarizeTranslationOutputSchema},
  prompt: `You are an expert translator and summarizer, skilled in helping language learners.

  Please provide a concise summary of the following translated text in {{{language}}}. The summary should capture the main points and be easy to understand for someone learning the language.

  Translation: {{{translation}}}
  Language: {{{language}}}

  Summary:
`,
});

const summarizeTranslationFlow = ai.defineFlow(
  {
    name: 'summarizeTranslationFlow',
    inputSchema: SummarizeTranslationInputSchema,
    outputSchema: SummarizeTranslationOutputSchema,
  },
  async input => {
    const {output} = await summarizeTranslationPrompt(input);
    return output!;
  }
);
