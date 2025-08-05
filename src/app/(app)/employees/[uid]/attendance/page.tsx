
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2, Calendar as CalendarIcon, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, orderBy, query, Timestamp, doc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};

type DailyAttendanceSummary = {
    key: string;
    employeeName: string;
    employeeId: string;
    date: string;
    clockInTime: string | null;
    clockOutTime: string | null;
    lateMinutes: number | null;
    dayDate: Date;
};

type ScheduleSettings = {
    clockInTime: string;
};

type UserData = {
    name: string;
    employeeId: string;
};

export default function UserAttendancePage({ params }: { params: { uid: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  
  const { uid } = params;

  const fetchAttendanceAndSettings = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    let targetUser: UserData | null = null;
    try {
        // Fetch user data
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            targetUser = userSnap.data() as UserData
            setUserData(targetUser);
        } else {
             toast({
                title: "Pengguna Tidak Ditemukan",
                variant: "destructive",
            });
            router.back();
            return;
        }

        // Fetch schedule settings
        const scheduleRef = doc(db, 'settings', 'schedule');
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
            setScheduleSettings(scheduleSnap.data() as ScheduleSettings);
        }

        // Fetch attendance records for the specific employee
        if (targetUser && targetUser.employeeId) {
            const q = query(
                collection(db, "attendance"),
                where('employeeId', '==', targetUser.employeeId)
            );
            const querySnapshot = await getDocs(q);
            const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
            setAllAttendanceRecords(records);
        }

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({
            title: "Gagal Memuat Data",
            description: "Terjadi kesalahan saat mengambil data absensi.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  }, [toast, uid, router]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/dashboard');
    } else {
      fetchAttendanceAndSettings();
    }
  }, [user, router, fetchAttendanceAndSettings]);
  

  const dailySummaries = useMemo(() => {
    const summaries: Record<string, DailyAttendanceSummary> = {};

    const filteredRecords = allAttendanceRecords.filter(record => {
        if (!date?.from) return true;
        const from = date.from;
        const to = date.to || date.from;
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        const recordDate = record.createdAt.toDate();
        return recordDate >= from && recordDate <= to;
    });

    // Sort records by time to process them chronologically
    const sortedRecords = filteredRecords.sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    sortedRecords.forEach(record => {
        const key = `${record.employeeId}-${record.date}`;
        if (!summaries[key]) {
            summaries[key] = {
                key,
                employeeName: record.employeeName,
                employeeId: record.employeeId,
                date: record.date,
                clockInTime: null,
                clockOutTime: null,
                lateMinutes: null,
                dayDate: record.createdAt.toDate(),
            };
        }

        const summary = summaries[key];
        const recordTime = record.createdAt.toDate();

        if (record.status === 'Clocked In') {
            // Only set the first clock in
            if (summary.clockInTime === null) {
                summary.clockInTime = record.time;

                if (scheduleSettings?.clockInTime) {
                    const [hours, minutes] = scheduleSettings.clockInTime.split(':').map(Number);
                    const deadline = new Date(recordTime);
                    deadline.setHours(hours, minutes, 0, 0);
                    
                    if (recordTime > deadline) {
                        const diffMs = recordTime.getTime() - deadline.getTime();
                        summary.lateMinutes = Math.round(diffMs / 60000);
                    } else {
                        summary.lateMinutes = 0; // On time
                    }
                }
            }
        }

        if (record.status === 'Clocked Out') {
            // Always update with the latest clock out
            summary.clockOutTime = record.time;
        }
    });
    
    return Object.values(summaries).sort((a, b) => b.dayDate.getTime() - a.dayDate.getTime());
  }, [allAttendanceRecords, date, scheduleSettings]);


  const handleDownloadPdf = () => {
    if (dailySummaries.length === 0) {
      toast({
        title: 'Tidak Ada Data',
        description: 'Tidak ada data untuk diunduh dalam rentang tanggal yang dipilih.',
        variant: 'destructive',
      });
      return;
    }
    
    const doc = new jsPDF();
    
    const title = `Laporan Absensi: ${userData?.name}`;
    const dateRange = date?.from ? `${format(date.from, 'd MMMM yyyy', { locale: localeID })} - ${format(date.to || date.from, 'd MMMM yyyy', { locale: localeID })}` : 'Semua Waktu';
    const fileName = `laporan_absensi_${userData?.name?.replace(' ', '_')}_${date?.from ? format(date.from, 'yyyy-MM-dd') : 'all'}.pdf`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Periode: ${dateRange}`, 14, 30);

    const tableColumn = ["Tanggal", "Waktu Masuk", "Waktu Pulang", "Keterlambatan"];
    const tableRows: (string | number | null)[][] = [];

    dailySummaries.forEach(record => {
        const lateStatus = record.lateMinutes === null ? 'N/A' : record.lateMinutes > 0 ? `${record.lateMinutes} menit` : 'Tepat Waktu';
        const ticketData = [
            record.date,
            record.clockInTime || ' - ',
            record.clockOutTime || ' - ',
            lateStatus,
        ];
        tableRows.push(ticketData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save(fileName);
  };


  if (user?.role !== 'admin' || loading) {
     return (
       <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
     )
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/40 p-4 md:p-10">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
               <div className='mb-4'>
                 <Button variant="outline" size="sm" asChild>
                    <Link href="/employees">
                       <ArrowLeft className="mr-2" /> Kembali ke Daftar Karyawan
                    </Link>
                 </Button>
               </div>
               <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="text-primary" />
                Riwayat Absensi: {loading ? <Skeleton className='h-8 w-48'/> : userData?.name}
              </CardTitle>
              <CardDescription>
                Ringkasan harian dari seluruh absensi karyawan yang dipilih.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-[260px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
               <Button onClick={handleDownloadPdf} disabled={loading}>
                  <Download className="mr-2" /> Unduh PDF
                </Button>
            </div>
          </div>
         
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu Masuk</TableHead>
                  <TableHead>Waktu Pulang</TableHead>
                  <TableHead className="text-right">Keterlambatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : dailySummaries.length > 0 ? (
                  dailySummaries.map((summary) => (
                    <TableRow key={summary.key}>
                      <TableCell>{summary.date}</TableCell>
                      <TableCell>{summary.clockInTime || ' - '}</TableCell>
                      <TableCell>{summary.clockOutTime || ' - '}</TableCell>
                      <TableCell className="text-right">
                        {summary.lateMinutes === null ? (
                            <span className="text-muted-foreground">-</span>
                        ) : summary.lateMinutes > 0 ? (
                            <Badge variant="destructive">{summary.lateMinutes} menit</Badge>
                        ) : (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                Tepat Waktu
                            </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            Tidak ada catatan absensi untuk karyawan ini.
                        </TableCell>
                     </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
