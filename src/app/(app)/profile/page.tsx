
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Building, Briefcase, Loader2, MapPin, History } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type AttendanceRecord = {
  id: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user || !user.employeeId) {
      setLoadingHistory(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.employeeId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendanceHistory(history);
    } catch (e) {
      console.error("Error fetching attendance history: ", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }

  if (loading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 border-4 border-primary">
                <AvatarImage src={user.faceprint || undefined} alt={user.name || 'User Avatar'} />
                <AvatarFallback className="text-3xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                 <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{user.role === 'admin' ? 'Administrator' : 'Karyawan'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
                <h3 className="font-semibold text-xl border-b pb-2">Detail Akun</h3>
                <div className="space-y-4">
                     <div className="space-y-1">
                        <Label htmlFor='fullName'>Nama Lengkap</Label>
                        <div className='flex items-center gap-2'>
                           <User className='text-muted-foreground'/>
                           <Input id='fullName' value={user.name || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='email'>Alamat Email</Label>
                        <div className='flex items-center gap-2'>
                           <Mail className='text-muted-foreground'/>
                           <Input id='email' value={user.email || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='employeeId'>ID Karyawan</Label>
                        <div className='flex items-center gap-2'>
                           <Briefcase className='text-muted-foreground'/>
                           <Input id='employeeId' value={user.employeeId || 'N/A'} disabled/>
                        </div>
                     </div>
                       <div className="space-y-1">
                        <Label htmlFor='department'>Departemen</Label>
                        <div className='flex items-center gap-2'>
                           <Building className='text-muted-foreground'/>
                           <Input id='department' value={user.department || 'N/A'} disabled/>
                        </div>
                     </div>
                </div>
            </div>
            <div className="space-y-6">
                 <h3 className="font-semibold text-xl border-b pb-2">Foto Wajah Terdaftar</h3>
                 {user.faceprint ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                        <Image src={user.faceprint} alt="Foto Wajah Terdaftar" layout="fill" objectFit="cover" />
                    </div>
                 ) : (
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Belum ada foto wajah terdaftar.</p>
                    </div>
                 )}
            </div>
        </CardContent>
      </Card>
      
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <History className="text-primary"/>
                Riwayat Absensi Saya
            </CardTitle>
            <CardDescription>Seluruh catatan absensi Anda yang tersimpan di sistem.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-y-auto max-h-[60vh]">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingHistory ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : attendanceHistory.length > 0 ? (
                        attendanceHistory.map((record) => (
                            <TableRow key={record.id}>
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
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    Belum ada riwayat absensi.
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
