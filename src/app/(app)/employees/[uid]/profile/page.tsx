
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Building, Briefcase, Loader2, History, ArrowLeft, Clock } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Schedule = Record<string, { clockIn: string; clockOut: string }>;

type UserData = {
    uid: string;
    name: string;
    email: string;
    faceprint?: string;
    employeeId?: string;
    department?: string;
    role: 'admin' | 'employee';
    schedule?: Schedule;
}

type AttendanceRecord = {
  id: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};

const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function UserProfilePage({ params }: { params: { uid: string } }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { uid } = params;

  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserDataAndHistory = useCallback(async () => {
    if (!uid || !authUser) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            router.replace('/employees');
            return;
        }
        
        const userData = { uid: userSnap.id, ...userSnap.data() } as UserData;
        setTargetUser(userData);

        if (userData.uid) {
            const q = query(
                collection(db, 'attendance'),
                where('uid', '==', userData.uid),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
            setAttendanceHistory(history);
        }
    } catch (e) {
      console.error("Error fetching user data and history: ", e);
    } finally {
      setLoading(false);
    }
  }, [uid, router, authUser]);

  useEffect(() => {
    if (!authLoading) {
      if (authUser?.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        fetchUserDataAndHistory();
      }
    }
  }, [authUser, authLoading, router, fetchUserDataAndHistory]);

  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }

  if (loading || authLoading || !authUser || !targetUser) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <div className='mb-4'>
            <Button variant="outline" size="sm" asChild>
                <Link href="/employees">
                    <ArrowLeft className="mr-2" /> Kembali ke Daftar Karyawan
                </Link>
            </Button>
        </div>

      <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg rounded-xl">
                 <CardHeader className="items-center text-center">
                    <Avatar className="h-28 w-28 border-4 border-primary">
                        <AvatarImage src={targetUser.faceprint || undefined} alt={targetUser.name || 'User Avatar'} />
                        <AvatarFallback className="text-5xl">{targetUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                     <CardTitle className="text-2xl font-bold pt-4">{targetUser.name}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{targetUser.role === 'admin' ? 'Administrator' : 'Karyawan'}</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     <div className="space-y-1">
                        <Label>Email</Label>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                           <Mail className='h-4 w-4'/>
                           <span>{targetUser.email}</span>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label>ID Karyawan</Label>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                           <Briefcase className='h-4 w-4'/>
                           <span>{targetUser.employeeId || 'N/A'}</span>
                        </div>
                     </div>
                       <div className="space-y-1">
                        <Label>Departemen</Label>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                           <Building className='h-4 w-4'/>
                           <span>{targetUser.department || 'N/A'}</span>
                        </div>
                     </div>
                 </CardContent>
            </Card>
             <Card className="shadow-lg rounded-xl">
                 <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Clock className="text-primary"/>
                        Jadwal Kerja
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    {targetUser.schedule && Object.values(targetUser.schedule).some(day => day.clockIn || day.clockOut) ? (
                        <div className="space-y-2 text-sm">
                            {daysOfWeek.map(day => {
                                const daySchedule = targetUser.schedule?.[day];
                                if (!daySchedule || (!daySchedule.clockIn && !daySchedule.clockOut)) return null;
                                return (
                                    <div key={day} className="flex justify-between items-center">
                                        <span className="font-medium">{day}</span>
                                        <span className="text-muted-foreground">
                                            {daySchedule.clockIn || '--:--'} - {daySchedule.clockOut || '--:--'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Mengikuti jadwal global/departemen.</p>
                    )}
                 </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Foto Wajah Terdaftar</CardTitle>
                </CardHeader>
                <CardContent>
                    {targetUser.faceprint ? (
                        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                            <Image src={targetUser.faceprint} alt="Foto Wajah Terdaftar" layout="fill" objectFit="cover" />
                        </div>
                    ) : (
                        <div className="w-full max-w-sm mx-auto aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">Belum ada foto wajah terdaftar.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <History className="text-primary"/>
                        Riwayat Absensi Terakhir
                    </CardTitle>
                    <CardDescription>Seluruh catatan absensi yang tersimpan untuk pengguna ini.</CardDescription>
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
                                {loading ? (
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
                     <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/employees/${targetUser.uid}/attendance`}>
                                Lihat Semua Riwayat
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
