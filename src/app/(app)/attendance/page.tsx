
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
import { ClipboardList, Loader2, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
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

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};

// Extend jsPDF with autoTable method
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const fetchAttendanceRecords = useCallback(async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "attendance"), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
        setAllAttendanceRecords(records);
    } catch (error) {
        console.error("Error fetching attendance records: ", error);
        toast({
            title: "Gagal Memuat Data",
            description: "Terjadi kesalahan saat mengambil catatan absensi.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/dashboard');
    } else {
      fetchAttendanceRecords();
    }
  }, [user, router, fetchAttendanceRecords]);
  
  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }

  const filteredAttendanceRecords = useMemo(() => {
    if (!date?.from) {
      return allAttendanceRecords;
    }
    const from = date.from;
    const to = date.to || date.from;
    
    // Set time to beginning of the day for `from` and end of the day for `to`
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    return allAttendanceRecords.filter(record => {
        const recordDate = record.createdAt.toDate();
        return recordDate >= from && recordDate <= to;
    });
  }, [allAttendanceRecords, date]);

  const handleDownloadPdf = () => {
    if (filteredAttendanceRecords.length === 0) {
      toast({
        title: 'Tidak Ada Data',
        description: 'Tidak ada data untuk diunduh dalam rentang tanggal yang dipilih.',
        variant: 'destructive',
      });
      return;
    }
    
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    const title = 'Laporan Absensi';
    const dateRange = date?.from ? `${format(date.from, 'd MMMM yyyy', { locale: localeID })} - ${format(date.to || date.from, 'd MMMM yyyy', { locale: localeID })}` : 'Semua Waktu';
    const fileName = `laporan_absensi_${date?.from ? format(date.from, 'yyyy-MM-dd') : 'all'}.pdf`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Periode: ${dateRange}`, 14, 30);
    
    doc.autoTable({
        startY: 35,
        head: [['Nama Karyawan', 'ID Karyawan', 'Tanggal', 'Waktu', 'Status']],
        body: filteredAttendanceRecords.map(record => [
            record.employeeName,
            record.employeeId,
            record.date,
            record.time,
            statusLocale[record.status] || record.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save(fileName);
  };


  if (user?.role !== 'admin') {
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
               <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="text-primary" />
                Catatan Absensi
              </CardTitle>
              <CardDescription>
                Catatan lengkap dari semua entri absensi karyawan.
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
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead>ID Karyawan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : filteredAttendanceRecords.length > 0 ? (
                  filteredAttendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{record.employeeId}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={record.status === 'Clocked In' ? 'default' : 'secondary'}
                          className={
                            record.status === 'Clocked In'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
                          }
                        >
                          {statusLocale[record.status] || record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                            Tidak ada catatan absensi pada rentang tanggal ini.
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
