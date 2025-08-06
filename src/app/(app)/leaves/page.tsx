
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
import { FileText, Loader2, PlusCircle, Calendar as CalendarIcon, Send, Trash2, Upload, Paperclip } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, getDocs, orderBy, query, Timestamp, doc, addDoc, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';


type LeaveRequest = {
  id: string;
  uid: string;
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
  attachmentUrl?: string;
  attachmentPath?: string;
};


// Child component for Employee View
function EmployeeLeavesView({ user, toast }: { user: any, toast: (options: any) => void }) {
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [leaveType, setLeaveType] = useState('');
    const [reason, setReason] = useState('');
    const [dates, setDates] = useState<DateRange | undefined>(undefined);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchMyRequests = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const q = query(
                collection(db, "leaveRequests"),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const requestList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            setMyRequests(requestList);

             for (const req of requestList) {
                if ((req.status === 'Disetujui' || req.status === 'Ditolak') && !req.acknowledgedByEmployee) {
                    toast({
                        title: `Pengajuan ${req.leaveType} Anda Diperbarui`,
                        description: `Status pengajuan untuk tanggal ${req.startDate} sekarang: ${req.status}.`,
                        duration: 8000,
                    });
                    const reqDoc = doc(db, 'leaveRequests', req.id);
                    await updateDoc(reqDoc, { acknowledgedByEmployee: true });
                }
            }
        } catch (error) {
            console.error("Error fetching leave requests: ", error);
            toast({ title: "Gagal Memuat Pengajuan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.employeeId || !leaveType || !reason || !dates?.from) {
        toast({ title: 'Data Tidak Lengkap', description: 'Harap isi semua field yang diperlukan.', variant: 'destructive'});
        return;
        }

        if(leaveType === 'Sakit' && !attachmentFile) {
            toast({ title: 'Bukti Diperlukan', description: 'Untuk pengajuan sakit, Anda wajib mengunggah bukti dukung.', variant: 'destructive'});
            return;
        }

        setIsSubmitting(true);
        let fileUrl = '';
        let filePath = '';

        try {
             if (attachmentFile && leaveType === 'Sakit') {
                setIsUploading(true);
                const storagePath = `leave-attachments/${user.uid}/${Date.now()}-${attachmentFile.name}`;
                const storageRef = ref(storage, storagePath);
                const snapshot = await uploadBytes(storageRef, attachmentFile);
                fileUrl = await getDownloadURL(snapshot.ref);
                filePath = storagePath;
                setIsUploading(false);
            }

            const requestData: Omit<LeaveRequest, 'id'> = {
                uid: user.uid,
                employeeId: user.employeeId,
                employeeName: user.name,
                leaveType: leaveType as any,
                reason: reason,
                startDate: format(dates.from, 'yyyy-MM-dd'),
                endDate: dates.to ? format(dates.to, 'yyyy-MM-dd') : format(dates.from, 'yyyy-MM-dd'),
                status: 'Menunggu',
                createdAt: Timestamp.now(),
                acknowledgedByEmployee: true,
                statusUpdatedAt: null,
            };

            if (fileUrl) {
                requestData.attachmentUrl = fileUrl;
                requestData.attachmentPath = filePath;
            }

            await addDoc(collection(db, 'leaveRequests'), requestData);

            toast({ title: 'Pengajuan Terkirim', description: 'Pengajuan cuti/izin Anda telah berhasil dikirim.'});
            setLeaveType('');
            setReason('');
            setDates(undefined);
            setAttachmentFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
            await fetchMyRequests();

        } catch (error) {
            console.error("Error submitting request:", error);
            toast({ title: 'Gagal Mengirim', description: 'Terjadi kesalahan saat mengirim pengajuan.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // 5MB limit
            if (file.size > 5 * 1024 * 1024) {
                 toast({ title: 'Ukuran File Terlalu Besar', description: 'Ukuran file maksimal adalah 5MB.', variant: 'destructive' });
                 setAttachmentFile(null);
                 if (fileInputRef.current) fileInputRef.current.value = "";
                 return;
            }
            setAttachmentFile(file);
        }
    };

    const statusBadgeVariant = { 'Menunggu': 'secondary', 'Disetujui': 'default', 'Ditolak': 'destructive' } as const;
    
    const submitButtonText = () => {
        if(isUploading) return "Mengunggah file...";
        if(isSubmitting) return "Mengirim pengajuan...";
        return "Kirim Pengajuan";
    }

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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <Label htmlFor="leaveType" className="md:w-40">Jenis Pengajuan</Label>
                            <Select onValueChange={(value) => { setLeaveType(value); setAttachmentFile(null); }} value={leaveType} disabled={isSubmitting || isUploading}>
                                <SelectTrigger id="leaveType" className="flex-1">
                                    <SelectValue placeholder="Pilih jenis cuti/izin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                                    <SelectItem value="Sakit">Sakit</SelectItem>
                                    <SelectItem value="Izin Khusus">Izin Khusus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <Label className="md:w-40">Tanggal Pengajuan</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal flex-1"
                                    disabled={isSubmitting || isUploading}
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
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <Label htmlFor="reason" className="md:w-40 pt-2">Alasan/Keterangan</Label>
                            <Textarea
                                id="reason"
                                placeholder="Jelaskan alasan Anda secara singkat..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isSubmitting || isUploading}
                                className='flex-1'
                            />
                        </div>

                        {leaveType === 'Sakit' && (
                             <div className="flex flex-col md:flex-row gap-4 items-center">
                                <Label htmlFor="attachment" className="md:w-40">Bukti Dukung</Label>
                                <div className='flex-1'>
                                     <Input 
                                        id="attachment"
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden"
                                        accept="image/jpeg,image/png,application/pdf"
                                        disabled={isSubmitting || isUploading}
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || isUploading}>
                                        <Upload className='mr-2'/>
                                        Pilih File (Max 5MB)
                                    </Button>
                                    {attachmentFile && <p className="text-sm text-muted-foreground mt-2">File dipilih: {attachmentFile.name}</p>}
                                </div>
                            </div>
                        )}

                        <div className='flex justify-end'>
                            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isUploading || !leaveType || !reason || !dates?.from}>
                                {(isSubmitting || isUploading) ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                                {submitButtonText()}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="text-primary" />
                        Riwayat Pengajuan Anda
                    </CardTitle>
                    <CardDescription>
                       Daftar semua pengajuan cuti dan izin yang pernah Anda buat.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Tanggal Mulai</TableHead>
                                    <TableHead>Tanggal Selesai</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Lampiran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    </TableRow>
                                ))
                                ) : myRequests.length > 0 ? (
                                myRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.leaveType}</TableCell>
                                        <TableCell>{req.startDate}</TableCell>
                                        <TableCell>{req.endDate}</TableCell>
                                        <TableCell><p className='w-40 truncate'>{req.reason}</p></TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadgeVariant[req.status]}>
                                            {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {req.attachmentUrl ? (
                                                <Button variant="link" asChild className="p-0 h-auto">
                                                    <Link href={req.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                        Lihat Bukti
                                                    </Link>
                                                </Button>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
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

// Child component for Admin View
function AdminLeavesView({ toast }: { toast: (options: any) => void }) {
    const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchAllRequests = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "leaveRequests"), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const requestList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
            setAllRequests(requestList);
        } catch (error) {
            console.error("Error fetching all requests: ", error);
            toast({ title: "Gagal Memuat Semua Pengajuan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAllRequests();
    }, [fetchAllRequests]);

    const handleUpdateStatus = async (id: string, status: 'Disetujui' | 'Ditolak') => {
        setUpdatingId(id);
        try {
            const docRef = doc(db, 'leaveRequests', id);
            await updateDoc(docRef, { 
                status: status,
                statusUpdatedAt: Timestamp.now(),
                acknowledgedByEmployee: false, // Reset acknowledgment so employee gets notified
            });
            toast({ title: 'Status Diperbarui', description: `Pengajuan telah ditandai sebagai ${status}.`});
            await fetchAllRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            toast({ title: 'Gagal Memperbarui', variant: 'destructive'});
        } finally {
            setUpdatingId(null);
        }
    }

    const handleDeleteRequest = async (request: LeaveRequest) => {
        setDeletingId(request.id);
        try {
            // If there's an attachment, delete it from Storage first
            if (request.attachmentPath) {
                const fileRef = ref(storage, request.attachmentPath);
                await deleteObject(fileRef);
            }

            // Delete the document from Firestore
            await deleteDoc(doc(db, 'leaveRequests', request.id));
            
            toast({ title: 'Pengajuan Dihapus', description: 'Data pengajuan cuti/izin telah berhasil dihapus.' });
            await fetchAllRequests();
        } catch (error: any) {
            // Handle case where file might not exist in storage but doc does
            if (error.code === 'storage/object-not-found') {
                console.warn('File not found in storage, but proceeding to delete firestore doc');
                await deleteDoc(doc(db, 'leaveRequests', request.id));
                 toast({ title: 'Pengajuan Dihapus', description: 'Data pengajuan cuti/izin telah berhasil dihapus.' });
                await fetchAllRequests();
            } else {
                console.error('Error deleting request:', error);
                toast({ title: 'Gagal Menghapus', variant: 'destructive' });
            }
        } finally {
            setDeletingId(null);
        }
    };

    const statusBadgeVariant = { 'Menunggu': 'secondary', 'Disetujui': 'default', 'Ditolak': 'destructive' } as const;

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-primary" />
                    Manajemen Cuti & Izin Karyawan
                </CardTitle>
                <CardDescription>
                    Daftar semua pengajuan cuti dan izin dari seluruh karyawan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Karyawan</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Bukti</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                            ) : allRequests.length > 0 ? (
                            allRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell>{req.leaveType}</TableCell>
                                    <TableCell>{req.startDate} - {req.endDate}</TableCell>
                                    <TableCell><p className='w-40 truncate' title={req.reason}>{req.reason}</p></TableCell>
                                    <TableCell>
                                        {req.attachmentUrl ? (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" className='flex items-center gap-2'>
                                                  <Paperclip className="h-4 w-4" /> Lihat
                                                </Link>
                                            </Button>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadgeVariant[req.status]}>
                                        {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-1 justify-end items-center">
                                        {req.status === 'Menunggu' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, 'Ditolak')} disabled={updatingId === req.id}>
                                                    {updatingId === req.id ? <Loader2 className="animate-spin" /> : 'Tolak'}
                                                </Button>
                                                <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'Disetujui')} disabled={updatingId === req.id}>
                                                    {updatingId === req.id ? <Loader2 className="animate-spin" /> : 'Setujui'}
                                                </Button>
                                            </>
                                        )}
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={deletingId === req.id}>
                                                    {deletingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin menghapus pengajuan <strong>{req.leaveType}</strong> oleh <strong>{req.employeeName}</strong>? Tindakan ini tidak dapat diurungkan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteRequest(req)} className="bg-destructive hover:bg-destructive/90">
                                                        Ya, Hapus
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                    Belum ada data pengajuan dari karyawan.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// Main page component
export default function LeavesPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();

    if (loading || !user) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (user.role === 'admin') {
        return <AdminLeavesView toast={toast} />;
    }

    return <EmployeeLeavesView user={user} toast={toast} />;
}
