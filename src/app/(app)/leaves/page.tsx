
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
import { Button } from '@/components/ui/button';
import { FileText, Loader2, PlusCircle, Calendar as CalendarIcon, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, orderBy, query, Timestamp, doc, addDoc, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Cuti Tahunan' | 'Sakit' | 'Izin Khusus';
  reason: string;
  startDate: string;
  endDate: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  createdAt: Timestamp;
  statusUpdatedAt: Timestamp | null;
  acknowledgedByEmployee: boolean;
};

export default function LeavesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [dates, setDates] = useState<DateRange | undefined>(undefined);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let q;
      if (user?.role === 'admin') {
        q = query(collection(db, "leaveRequests"), orderBy('createdAt', 'desc'));
      } else if (user?.employeeId) {
        q = query(collection(db, "leaveRequests"), where('employeeId', '==', user.employeeId), orderBy('createdAt', 'desc'));
      } else {
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const requestList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      setRequests(requestList);
      
      // For employees, check for unacknowledged status changes
      if (user?.role === 'employee') {
          for (const req of requestList) {
              if (req.status !== 'Menunggu' && !req.acknowledgedByEmployee) {
                  toast({
                      title: `Pengajuan ${req.leaveType} Anda Diperbarui`,
                      description: `Status pengajuan untuk tanggal ${req.startDate} sekarang: ${req.status}.`,
                      duration: 8000,
                  });
                  // Mark as acknowledged
                  const reqDoc = doc(db, 'leaveRequests', req.id);
                  await updateDoc(reqDoc, { acknowledgedByEmployee: true });
              }
          }
      }

    } catch (error) {
      console.error("Error fetching leave requests: ", error);
      toast({
        title: "Gagal Memuat Data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
        fetchRequests();
    }
  }, [user, fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.employeeId || !leaveType || !reason || !dates?.from) {
      toast({ title: 'Data Tidak Lengkap', description: 'Harap isi semua field yang diperlukan.', variant: 'destructive'});
      return;
    }

    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'leaveRequests'), {
            employeeId: user.employeeId,
            employeeName: user.name,
            leaveType: leaveType,
            reason: reason,
            startDate: format(dates.from, 'yyyy-MM-dd'),
            endDate: dates.to ? format(dates.to, 'yyyy-MM-dd') : format(dates.from, 'yyyy-MM-dd'),
            status: 'Menunggu',
            createdAt: Timestamp.now(),
            statusUpdatedAt: null,
            acknowledgedByEmployee: false,
        });

        toast({ title: 'Pengajuan Terkirim', description: 'Pengajuan cuti/izin Anda telah berhasil dikirim.'});
        setLeaveType('');
        setReason('');
        setDates(undefined);
        await fetchRequests();

    } catch (error) {
        console.error("Error submitting request:", error);
        toast({ title: 'Gagal Mengirim', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Disetujui' | 'Ditolak') => {
    try {
        const docRef = doc(db, 'leaveRequests', id);
        await updateDoc(docRef, { 
            status: status,
            statusUpdatedAt: Timestamp.now(),
            acknowledgedByEmployee: false, // Reset acknowledgment so employee gets notified
        });
        toast({ title: 'Status Diperbarui', description: `Pengajuan telah ditandai sebagai ${status}.`});
        await fetchRequests();
    } catch (error) {
        console.error('Error updating status:', error);
        toast({ title: 'Gagal Memperbarui', variant: 'destructive'});
    }
  }
  
  const statusBadgeVariant = {
    'Menunggu': 'secondary',
    'Disetujui': 'default',
    'Ditolak': 'destructive',
  } as const;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="text-primary" />
            Formulir Pengajuan Cuti & Izin
          </CardTitle>
          <CardDescription>
            Isi formulir di bawah ini untuk mengajukan cuti tahunan, sakit, atau izin khusus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                    <Label htmlFor="leaveType">Jenis Pengajuan</Label>
                    <Select onValueChange={setLeaveType} value={leaveType} disabled={isSubmitting}>
                        <SelectTrigger id="leaveType">
                            <SelectValue placeholder="Pilih jenis cuti/izin..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                            <SelectItem value="Sakit">Sakit</SelectItem>
                            <SelectItem value="Izin Khusus">Izin Khusus</SelectItem>
                        </SelectContent>
                    </Select>
               </div>
                <div className="space-y-2">
                    <Label>Tanggal Pengajuan</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dates?.from ? (
                            dates.to ? (
                                <>
                                {format(dates.from, "LLL dd, y")} -{" "}
                                {format(dates.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dates.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pilih tanggal</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dates?.from}
                            selected={dates}
                            onSelect={setDates}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
               </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="reason">Alasan/Keterangan</Label>
                <Textarea
                    id="reason"
                    placeholder="Jelaskan alasan Anda secara singkat..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isSubmitting}
                />
             </div>
             <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                Kirim Pengajuan
             </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            Riwayat Pengajuan {user?.role === 'admin' ? 'Karyawan' : 'Anda'}
          </CardTitle>
          <CardDescription>
            {user?.role === 'admin' ? 'Daftar semua pengajuan cuti dan izin dari seluruh karyawan.' : 'Daftar semua pengajuan cuti dan izin yang pernah Anda buat.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {user?.role === 'admin' && <TableHead>Nama Karyawan</TableHead>}
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === 'admin' && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {user?.role === 'admin' && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                       {user?.role === 'admin' && <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : requests.length > 0 ? (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      {user?.role === 'admin' && <TableCell className="font-medium">{req.employeeName}</TableCell>}
                      <TableCell>{req.leaveType}</TableCell>
                      <TableCell>{req.startDate}</TableCell>
                      <TableCell>{req.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[req.status]}>
                          {req.status}
                        </Badge>
                      </TableCell>
                       {user?.role === 'admin' && (
                        <TableCell className="text-right">
                           {req.status === 'Menunggu' && (
                             <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, 'Ditolak')}>Tolak</Button>
                                <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'Disetujui')}>Setujui</Button>
                             </div>
                           )}
                        </TableCell>
                       )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' ? 6 : 4} className="text-center text-muted-foreground h-24">
                      Belum ada data pengajuan.
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

    