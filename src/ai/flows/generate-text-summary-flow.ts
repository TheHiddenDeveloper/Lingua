
'use server';
/**
 * @fileOverview Genkit flow for generating concise summaries of long-form text.
 *
 * - generateTextSummary: Generates a summary for the given text and language.
 * - GenerateTextSummaryInputSchema: The input type for the generateTextSummary function.
 * - GenerateTextSummaryOutputSchema: The return type for the generateTextSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateTextSummaryInputSchema = z.object({
  text: z.string().describe('The long-form text to be summarized.'),
  language: z.string().describe('The language of the input text (e.g., "English", "Twi").'),
});
export type GenerateTextSummaryInput = z.infer<typeof GenerateTextSummaryInputSchema>;

export const GenerateTextSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the input text.'),
});
export type GenerateTextSummaryOutput = z.infer<typeof GenerateTextSummaryOutputSchema>;

export async function generateTextSummary(input: GenerateTextSummaryInput): Promise<GenerateTextSummaryOutput> {
  return generateTextSummaryFlow(input);
}

const summaryPrompt = ai.definePrompt({
  name: 'generateTextSummaryPrompt',
  input: { schema: GenerateTextSummaryInputSchema },
  output: { schema: GenerateTextSummaryOutputSchema },
  prompt: `You are an expert AI assistant skilled in summarizing various types of text content like news, articles, essays, or spoken transcripts.
Your goal is to provide a concise and accurate summary of the provided text.

The input text is in {{{language}}}.

Input Text:
{{{text}}}

Please generate a concise summary of the input text.
`,
  // Configure safety settings if needed, e.g. to be less restrictive for general text.
  // config: {
  //   safetySettings: [
  //     {
  //       category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  //       threshold: 'BLOCK_NONE', // Example: Adjust as per content policy
  //     },
  //   ],
  // },
});

const generateTextSummaryFlow = ai.defineFlow(
  {
    name: 'generateTextSummaryFlow',
    inputSchema: GenerateTextSummaryInputSchema,
    outputSchema: GenerateTextSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await summaryPrompt(input);
    if (!output) {
      throw new Error('No summary output received from the AI model.');
    }
    return output;
  }
);
