'use server';

/**
 * @fileOverview A Genkit flow for generating motivational work quotes.
 *
 * - getMotivationalQuote - A function that returns a motivational quote.
 * - MotivationalQuoteOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MotivationalQuoteOutputSchema = z.object({
  quote: z
    .string()
    .describe(
      'A short, impactful motivational quote related to work, success, or productivity in Indonesian.'
    ),
});
export type MotivationalQuoteOutput = z.infer<
  typeof MotivationalQuoteOutputSchema
>;

export async function getMotivationalQuote(): Promise<MotivationalQuoteOutput> {
  return motivationGeneratorFlow();
}

const prompt = ai.definePrompt({
  name: 'motivationGeneratorPrompt',
  output: { schema: MotivationalQuoteOutputSchema },
  prompt: `Generate a single, concise, and powerful motivational quote in Indonesian suitable for a professional work environment. The quote should inspire productivity, teamwork, or personal growth. Do not add quotation marks.`,
});

const motivationGeneratorFlow = ai.defineFlow(
  {
    name: 'motivationGeneratorFlow',
    outputSchema: MotivationalQuoteOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
