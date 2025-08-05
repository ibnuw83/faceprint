'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { attendanceRecords } from '@/lib/mock-data';
import { attendanceReportGenerator } from '@/ai/flows/attendance-report-generator';
import { FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport(null);
    try {
      const logs = JSON.stringify(attendanceRecords, null, 2);
      const result = await attendanceReportGenerator({ attendanceLogs: logs });
      setReport(result.summaryReport);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-primary" />
              Attendance Report Generator
            </CardTitle>
            <CardDescription>
              Use AI to analyze attendance logs and generate insightful summary reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p>
              Click the button below to process the latest attendance data and generate a report highlighting trends, absences, and punctuality.
            </p>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Generated Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        )}

        {report && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Generated Summary Report</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-code text-sm leading-relaxed">
                {report}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
