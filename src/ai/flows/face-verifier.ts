'use server';

/**
 * @fileOverview A Genkit flow for verifying if two faces belong to the same person.
 *
 * - verifyFaces - A function that handles the face verification process.
 * - FaceVerifierInput - The input type for the verifyFaces function.
 * - FaceVerifierOutput - The return type for the verifyFaces function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FaceVerifierInputSchema = z.object({
  registeredFace: z
    .string()
    .describe(
      "The reference face image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  captureToVerify: z
    .string()
    .describe(
      "The newly captured face image to verify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceVerifierInput = z.infer<typeof FaceVerifierInputSchema>;

const FaceVerifierOutputSchema = z.object({
  match: z.boolean().describe('Whether the two faces belong to the same person.'),
});
export type FaceVerifierOutput = z.infer<typeof FaceVerifierOutputSchema>;


export async function verifyFaces(
  input: FaceVerifierInput
): Promise<FaceVerifierOutput> {
  return faceVerifierFlow(input);
}


const prompt = ai.definePrompt({
  name: 'faceVerifierPrompt',
  input: { schema: FaceVerifierInputSchema },
  output: { schema: FaceVerifierOutputSchema },
  prompt: `You are a highly advanced AI security system specializing in facial recognition and verification. Your task is to determine if two images contain the face of the same person.

You will be given two images:
1.  **Registered Face**: This is the trusted, on-file image of the individual.
2.  **Capture to Verify**: This is the new image captured for verification.

Analyze the key facial features in both images (e.g., eye distance, nose shape, jawline, unique markers). Compare them to determine if they belong to the same person.

Set the 'match' field to 'true' if you are confident it's the same person, and 'false' otherwise. Prioritize accuracy and security.

Registered Face:
{{media url=registeredFace}}

Capture to Verify:
{{media url=captureToVerify}}
`,
});

const faceVerifierFlow = ai.defineFlow(
  {
    name: 'faceVerifierFlow',
    inputSchema: FaceVerifierInputSchema,
    outputSchema: FaceVerifierOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
