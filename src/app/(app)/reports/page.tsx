
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { attendanceReportGenerator } from '@/ai/flows/attendance-report-generator';
import { FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
};

export default function ReportsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const fetchAttendanceRecords = useCallback(async () => {
    try {
        const q = query(collection(db, "attendance"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setAttendanceRecords(records);
    } catch (error) {
        console.error("Error fetching attendance records: ", error);
        toast({
            title: "Gagal Memuat Data",
            description: "Terjadi kesalahan saat mengambil catatan absensi untuk laporan.",
            variant: "destructive",
        });
    }
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchAttendanceRecords();
      }
    }
  }, [user, authLoading, router, fetchAttendanceRecords]);

  const handleGenerateReport = async () => {
    if(attendanceRecords.length === 0) {
      toast({
        title: 'Tidak Ada Data',
        description: 'Tidak ada data absensi untuk dibuatkan laporan.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setReport(null);
    try {
      const logs = JSON.stringify(attendanceRecords, null, 2);
      const result = await attendanceReportGenerator({ attendanceLogs: logs });
      setReport(result.summaryReport);
    } catch (error) {
      console.error('Gagal membuat laporan:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat laporan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-primary" />
              Generator Laporan Absensi
            </CardTitle>
            <CardDescription>
              Gunakan AI untuk menganalisis log absensi dan menghasilkan laporan ringkasan yang berwawasan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p>
              Klik tombol di bawah untuk memproses data absensi terbaru dan membuat laporan yang menyoroti tren, absensi, dan ketepatan waktu.
            </p>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading && !report ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Laporan Baru'
              )}
            </Button>
          </CardContent>
        </Card>

        {(isLoading || report) && (
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Laporan yang Dihasilkan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                         <>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                        </>
                    ) : (
                         report && (
                            <pre className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-code text-sm leading-relaxed">
                                {report}
                            </pre>
                         )
                    )}
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
