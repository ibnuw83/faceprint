
'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const departmentsCollection = collection(db, 'departments');
      const departmentSnapshot = await getDocs(departmentsCollection);
      const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      setDepartments(departmentList.sort((a, b) => a.name.localeCompare(b.name)));
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
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      fetchDepartments();
    }
  }, [user, authLoading, router, fetchDepartments]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      toast({ title: 'Nama departemen tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'departments'), { name: newDepartmentName.trim() });
      toast({
        title: 'Departemen Berhasil Ditambahkan',
        description: `Departemen "${newDepartmentName.trim()}" telah dibuat.`,
      });
      setNewDepartmentName('');
      // Refetch departments to show the new one
      await fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      toast({
        title: 'Gagal Menambahkan Departemen',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    setDeletingId(departmentId);
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      toast({
        title: 'Departemen Berhasil Dihapus',
        description: 'Departemen yang dipilih telah dihapus.',
      });
      // Refetch to update list
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Gagal Menghapus Departemen',
        description: 'Terjadi kesalahan saat menghapus.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  // Prevent flash of content for non-admins
  if (authLoading || user?.role !== 'admin') {
     return (
       <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
     )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="text-primary" />
                Tambah Departemen Baru
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
                    placeholder="contoh: Pemasaran Digital"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || !newDepartmentName.trim()}>
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan...
                    </>
                    ) : (
                    <>
                        <PlusCircle className="mr-2" /> Tambah Departemen
                    </>
                    )}
                </Button>
                </form>
            </CardContent>
            </Card>
        </div>

        <Card className="shadow-lg rounded-xl lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <List className="text-primary" />
              Daftar Departemen
            </CardTitle>
             <CardDescription>
              Total: {departments.length} departemen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                   <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                    <p className="font-medium">{dept.name}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" disabled={!!deletingId}>
                           {deletingId === dept.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini akan menghapus departemen "{dept.name}" secara permanen. Pengguna yang terhubung dengan departemen ini tidak akan terhapus tetapi perlu diperbarui.
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
      </div>
    </div>
  );
}
    
