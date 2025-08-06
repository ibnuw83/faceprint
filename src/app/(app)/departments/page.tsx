
'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, PlusCircle, Trash2, Loader2, List, Edit, MapPin } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type Department = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export default function DepartmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for adding
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for editing
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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

  const validateCoordinates = (latStr: string, lngStr: string) => {
    if (!latStr && !lngStr) return { valid: true, data: {} };

    if (latStr && lngStr) {
      const lat = Number(latStr.replace(',', '.'));
      const lng = Number(lngStr.replace(',', '.'));
      if (isNaN(lat) || isNaN(lng)) {
        toast({ title: 'Koordinat Tidak Valid', description: 'Latitude dan Longitude harus berupa angka.', variant: 'destructive' });
        return { valid: false };
      }
      return { valid: true, data: { latitude: lat, longitude: lng } };
    }
    
    toast({ title: 'Koordinat Tidak Lengkap', description: 'Harap isi kedua field Latitude dan Longitude, atau kosongkan keduanya.', variant: 'destructive' });
    return { valid: false };
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      toast({ title: 'Nama departemen tidak boleh kosong', variant: 'destructive' });
      return;
    }
    
    const validation = validateCoordinates(newLat, newLng);
    if (!validation.valid) return;

    setIsSubmitting(true);
    try {
      const docData: { name: string, latitude?: number, longitude?: number } = {
        name: newDepartmentName.trim(),
      };
      if (validation.data && 'latitude' in validation.data) {
        docData.latitude = validation.data.latitude;
        docData.longitude = validation.data.longitude;
      }

      await addDoc(collection(db, 'departments'), docData);
      toast({
        title: 'Departemen Berhasil Ditambahkan',
        description: `Departemen "${newDepartmentName.trim()}" telah dibuat.`,
      });
      setNewDepartmentName('');
      setNewLat('');
      setNewLng('');
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

  const handleEditClick = (dept: Department) => {
    setEditingDepartment(dept);
    setEditName(dept.name);
    setEditLat(dept.latitude?.toString() || '');
    setEditLng(dept.longitude?.toString() || '');
    setIsEditDialogOpen(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editingDepartment || !editName.trim()) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }

    const validation = validateCoordinates(editLat, editLng);
    if (!validation.valid) return;
    
    setIsSavingEdit(true);
    try {
      const docRef = doc(db, 'departments', editingDepartment.id);
      const updateData: { name: string, latitude?: number, longitude?: number } = {
        name: editName.trim(),
      };

      if (validation.data && 'latitude' in validation.data) {
        updateData.latitude = validation.data.latitude;
        updateData.longitude = validation.data.longitude;
      } else {
        updateData.latitude = undefined;
        updateData.longitude = undefined;
      }

      await updateDoc(docRef, { ...updateData });

      toast({ title: 'Departemen Diperbarui', description: `Data untuk departemen ${editName.trim()} telah disimpan.`});
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      await fetchDepartments();

    } catch (error) {
      toast({ title: 'Gagal Menyimpan', variant: 'destructive' });
    } finally {
      setIsSavingEdit(false);
    }
  };


  const handleDeleteDepartment = async (departmentId: string) => {
    setDeletingId(departmentId);
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      toast({
        title: 'Departemen Berhasil Dihapus',
      });
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Gagal Menghapus Departemen',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };
  
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
                Buat departemen baru dan tentukan lokasi absensinya (opsional).
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
                  <div className="space-y-2">
                      <Label htmlFor="newLat">Latitude (Opsional)</Label>
                      <Input id="newLat" value={newLat} onChange={(e) => setNewLat(e.target.value)} placeholder="contoh: -6.200000" disabled={isSubmitting}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="newLng">Longitude (Opsional)</Label>
                      <Input id="newLng" value={newLng} onChange={(e) => setNewLng(e.target.value)} placeholder="contoh: 106.816666" disabled={isSubmitting}/>
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
              Total: {departments.length} departemen. Klik edit untuk mengubah detail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                   <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      {dept.latitude && dept.longitude ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>Lat: {dept.latitude.toFixed(4)}, Lng: {dept.longitude.toFixed(4)}</span>
                        </div>
                      ) : (
                         <p className="text-xs text-muted-foreground/70 italic mt-1">Lokasi mengikuti global</p>
                      )}
                    </div>

                    <div className='flex items-center'>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleEditClick(dept)}>
                        <Edit className="h-4 w-4" />
                      </Button>
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

                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Belum ada departemen yang ditambahkan.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Departemen</DialogTitle>
                <DialogDescription>
                   Ubah nama dan lokasi absensi khusus untuk departemen ini.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="editName">Nama Departemen</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSavingEdit} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="editLat">Latitude (Kosongkan untuk global)</Label>
                    <Input id="editLat" value={editLat} onChange={(e) => setEditLat(e.target.value)} disabled={isSavingEdit} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="editLng">Longitude (Kosongkan untuk global)</Label>
                    <Input id="editLng" value={editLng} onChange={(e) => setEditLng(e.target.value)} disabled={isSavingEdit} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveEdit} disabled={isSavingEdit}>
                    {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
