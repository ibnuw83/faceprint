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
  ClipboardList,
  FileText,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { attendanceRecords } from '@/lib/mock-data';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';


function AdminDashboard() {
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        setTotalEmployees(userSnapshot.size);
      } catch (error) {
        console.error("Error fetching user count:", error);
      }
    };
    fetchUsers();
  }, []);

  const presentToday = attendanceRecords.filter(
    (r) =>
      r.status === 'Clocked In' &&
      new Date(r.date).toDateString() === new Date().toDateString()
  ).length;
    
  const recentAttendance = [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  
  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dasbor Admin</h1>
        <p className="text-muted-foreground">
          Ringkasan aktivitas dan data penting dalam sistem.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AI</div>
             <Link href="/reports" className="text-xs text-muted-foreground hover:underline">
              Buat laporan ringkasan
            </Link>
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
                      <TableCell>{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
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
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <EmployeeDashboard />;
}
