
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import {
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import EmployeeDashboard from '@/components/employee-dashboard';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};


function AdminDashboard() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total users
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        setTotalEmployees(userSnapshot.size);

        // Fetch attendance for today
        const todayStr = new Date().toLocaleDateString('id-ID');
        const attendanceCollection = collection(db, 'attendance');
        
        const todayQuery = query(
            attendanceCollection, 
            where('date', '==', todayStr),
            where('status', '==', 'Clocked In')
        );
        const todaySnapshot = await getDocs(todayQuery);
        
        // Use a Set to count unique employees present today
        const uniquePresentIds = new Set(todaySnapshot.docs.map(doc => doc.data().employeeId));
        setPresentToday(uniquePresentIds.size);

        // Fetch recent attendance
        const recentQuery = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(recentQuery);
        const recentRecords = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setRecentAttendance(recentRecords);

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);
    
  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }

  return (
    <div className="flex flex-col w-full space-y-6">
       <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dasbor Admin</h1>
        <p className="text-muted-foreground">
          Ringkasan aktivitas dan data penting dalam sistem.
        </p>
      </div>
      <div className="container mx-auto p-0 space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <Link href="/employees" className="text-xs text-muted-foreground hover:underline">
              Lihat detail karyawan
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hadir Hari Ini
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
             <p className="text-xs text-muted-foreground">
              Karyawan yang sudah absen masuk
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absen Hari Ini</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees > 0 ? totalEmployees - presentToday : 0}</div>
            <p className="text-xs text-muted-foreground">
              Karyawan yang belum absen
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Aktivitas Absensi Terbaru</CardTitle>
              <CardDescription>
                5 aktivitas absensi (faceprint) terakhir dari karyawan.
              </CardDescription>
            </div>
             <Button asChild size="sm">
                <Link href="/attendance">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <EmployeeDashboard />;
}
