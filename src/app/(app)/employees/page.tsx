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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  uid: string;
  name: string;
  email: string;
  department?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  role: 'admin' | 'employee';
  employeeId?: string;
};

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: 'Gagal Memuat Pengguna',
        description: 'Terjadi kesalahan saat mengambil data pengguna dari Firestore.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat diurungkan.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: 'Pengguna Dihapus',
        description: 'Pengguna telah berhasil dihapus dari sistem.',
      });
      // Refresh user list
      fetchUsers();
    } catch (error) {
       console.error("Error deleting user:", error);
       toast({
        title: 'Gagal Menghapus Pengguna',
        description: 'Terjadi kesalahan. Pengguna tidak dapat dihapus.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-primary" />
              Manajemen Pengguna
            </CardTitle>
            <CardDescription>
              Lihat, tambah, atau kelola profil pengguna sistem.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/employees/new">
              <PlusCircle className="mr-2" /> Tambah Karyawan
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.department || 'N/A'}</TableCell>
                      <TableCell>{new Date(user.createdAt.seconds * 1000).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                              <Edit className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash2 className="mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
