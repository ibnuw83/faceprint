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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import EmployeeDashboard from '@/components/employee-dashboard';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const chartConfig = {
  clockedIn: {
    label: 'Masuk',
    color: 'hsl(var(--primary))',
  },
  clockedOut: {
    label: 'Keluar',
    color: 'hsl(var(--muted-foreground))',
  },
};

const chartData = [
  { day: 'Sen', clockedIn: 18, clockedOut: 17 },
  { day: 'Sel', clockedIn: 20, clockedOut: 20 },
  { day: 'Rab', clockedIn: 19, clockedOut: 19 },
  { day: 'Kam', clockedIn: 21, clockedOut: 21 },
  { day: 'Jum', clockedIn: 17, clockedOut: 17 },
];

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
            <p className="text-xs text-muted-foreground">
              Jumlah karyawan terdaftar
            </p>
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
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Laporan tersedia
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         {/* Attendance Chart */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Aktivitas Absensi Minggu Ini</CardTitle>
            <CardDescription>
              Tren absensi masuk dan keluar selama seminggu terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                 <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="clockedIn" fill="var(--color-clockedIn)" radius={4} />
                <Bar dataKey="clockedOut" fill="var(--color-clockedOut)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div className="space-y-6">
          <Link href="/employees">
            <Card className="hover:bg-muted/50 transition-colors shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manajemen Karyawan</CardTitle>
                  <CardDescription>
                    Tambah, lihat, atau kelola karyawan.
                  </CardDescription>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </CardHeader>
            </Card>
          </Link>
           <Link href="/attendance">
            <Card className="hover:bg-muted/50 transition-colors shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Catatan Absensi</CardTitle>
                  <CardDescription>
                    Lihat riwayat absensi semua karyawan.
                  </CardDescription>
                </div>
                <ClipboardList className="h-8 w-8 text-primary" />
              </CardHeader>
            </Card>
          </Link>
           <Link href="/reports">
            <Card className="hover:bg-muted/50 transition-colors shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generator Laporan</CardTitle>
                  <CardDescription>
                    Buat laporan absensi dengan AI.
                  </CardDescription>
                </div>
                 <FileText className="h-8 w-8 text-primary" />
              </CardHeader>
            </Card>
          </Link>
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
