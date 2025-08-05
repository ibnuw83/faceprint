'use server';

/**
 * @fileOverview Generates a summary report from attendance logs, highlighting trends, absences, and punctual employees.
 *
 * - attendanceReportGenerator - A function that generates the report.
 * - AttendanceReportInput - The input type for the attendanceReportGenerator function.
 * - AttendanceReportOutput - The return type for the attendanceReportGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AttendanceReportInputSchema = z.object({
  attendanceLogs: z
    .string()
    .describe('A JSON string of attendance logs, each log including employee ID, date, and time.'),
});
export type AttendanceReportInput = z.infer<typeof AttendanceReportInputSchema>;

const AttendanceReportOutputSchema = z.object({
  summaryReport: z
    .string()
    .describe(
      'A summary report highlighting attendance trends, absences, and punctual employees.'
    ),
});
export type AttendanceReportOutput = z.infer<typeof AttendanceReportOutputSchema>;

export async function attendanceReportGenerator(
  input: AttendanceReportInput
): Promise<AttendanceReportOutput> {
  return attendanceReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'attendanceReportPrompt',
  input: {schema: AttendanceReportInputSchema},
  output: {schema: AttendanceReportOutputSchema},
  prompt: `You are an AI assistant specialized in creating summary reports from employee attendance logs.

You will be provided with attendance logs in JSON format. Your task is to analyze these logs and generate a concise summary report that highlights key trends, including:

- Overall attendance trends (e.g., average attendance rate, fluctuations).
- Identification of employees with frequent absences.
- Recognition of employees who consistently demonstrate punctuality.
- Any other notable patterns or anomalies in the attendance data.

Here are the attendance logs:

{{{attendanceLogs}}}

Based on the provided attendance logs, generate a comprehensive summary report that provides actionable insights for HR managers.`,
});

const attendanceReportFlow = ai.defineFlow(
  {
    name: 'attendanceReportFlow',
    inputSchema: AttendanceReportInputSchema,
    outputSchema: AttendanceReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
