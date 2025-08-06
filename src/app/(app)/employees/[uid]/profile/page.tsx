
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Building, Briefcase, Loader2, History, ArrowLeft } from 'lucide-react';
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

type UserData = {
    uid: string;
    name: string;
    email: string;
    faceprint?: string;
    employeeId?: string;
    department?: string;
    role: 'admin' | 'employee';
}

type AttendanceRecord = {
  id: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};


export default function UserProfilePage({ params }: { params: { uid: string } }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { uid } = params;

  const fetchUserDataAndHistory = useCallback(async () => {
    if (!uid) {
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
        
        const userData = userSnap.data() as UserData;
        setTargetUser(userData);

        if (userData.employeeId) {
            const q = query(
                collection(db, 'attendance'),
                where('employeeId', '==', userData.employeeId),
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
  }, [uid, router]);

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

      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 border-4 border-primary">
                <AvatarImage src={targetUser.faceprint || undefined} alt={targetUser.name || 'User Avatar'} />
                <AvatarFallback className="text-3xl">{targetUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                 <CardTitle className="text-3xl font-bold">{targetUser.name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{targetUser.role === 'admin' ? 'Administrator' : 'Karyawan'}</CardDescription>
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
                           <Input id='fullName' value={targetUser.name || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='email'>Alamat Email</Label>
                        <div className='flex items-center gap-2'>
                           <Mail className='text-muted-foreground'/>
                           <Input id='email' value={targetUser.email || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='employeeId'>ID Karyawan</Label>
                        <div className='flex items-center gap-2'>
                           <Briefcase className='text-muted-foreground'/>
                           <Input id='employeeId' value={targetUser.employeeId || 'N/A'} disabled/>
                        </div>
                     </div>
                       <div className="space-y-1">
                        <Label htmlFor='department'>Departemen</Label>
                        <div className='flex items-center gap-2'>
                           <Building className='text-muted-foreground'/>
                           <Input id='department' value={targetUser.department || 'N/A'} disabled/>
                        </div>
                     </div>
                </div>
            </div>
            <div className="space-y-6">
                 <h3 className="font-semibold text-xl border-b pb-2">Foto Wajah Terdaftar</h3>
                 {targetUser.faceprint ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                        <Image src={targetUser.faceprint} alt="Foto Wajah Terdaftar" layout="fill" objectFit="cover" />
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
                Riwayat Absensi Karyawan
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
        </CardContent>
      </Card>
    </div>
  );
}
