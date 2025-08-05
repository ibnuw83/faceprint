
'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, PlusCircle, Trash2, Loader2, List } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type Department = {
  id: string;
  name: string;
};

export default function DepartmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const departmentsCollection = collection(db, 'departments');
      const departmentSnapshot = await getDocs(departmentsCollection);
      const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      setDepartments(departmentList);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Gagal Memuat Departemen',
        description: 'Terjadi kesalahan saat mengambil data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDepartments();
    }
  }, [user]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'departments'), { name: newDepartmentName });
      toast({
        title: 'Departemen Ditambahkan',
        description: `Departemen "${newDepartmentName}" berhasil dibuat.`,
      });
      setNewDepartmentName('');
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error('Error adding department:', error);
      toast({
        title: 'Gagal Menambahkan',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      toast({
        title: 'Departemen Dihapus',
        description: 'Departemen telah berhasil dihapus.',
      });
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Gagal Menghapus',
        description: 'Terjadi kesalahan saat menghapus departemen.',
        variant: 'destructive',
      });
    }
  };
  
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <List className="text-primary" />
              Daftar Departemen
            </CardTitle>
            <CardDescription>
              Lihat dan kelola semua departemen yang terdaftar di perusahaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                   <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-8 w-8" />
                  </div>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                    <p className="font-medium">{dept.name}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini akan menghapus departemen "{dept.name}" secara permanen. Tindakan ini tidak dapat diurungkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDepartment(dept.id)} className="bg-destructive hover:bg-destructive/90">
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Belum ada departemen yang ditambahkan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl h-fit">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="text-primary" />
              Tambah Departemen
            </CardTitle>
            <CardDescription>
              Buat departemen baru untuk organisasi Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departmentName">Nama Departemen</Label>
                <Input
                  id="departmentName"
                  placeholder="contoh: Marketing"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2" /> Tambah
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
