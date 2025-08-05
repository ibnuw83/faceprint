
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
import { Users, PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

type LocationSettings = {
    latitude: number;
    longitude: number;
    radius: number;
}

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
  faceprint?: string;
  locationSettings?: LocationSettings;
};

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for the edit form
  const [editName, setEditName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRadius, setEditRadius] = useState('');


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(userList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
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
  }, [toast]);

  useEffect(() => {
    if (authUser?.role === 'admin') {
      fetchUsers();
    }
  }, [authUser, fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    // A confirmation dialog is better than confirm() for UI consistency,
    // but for simplicity, we use confirm() here.
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat diurungkan.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: 'Pengguna Dihapus',
        description: 'Pengguna telah berhasil dihapus dari sistem.',
      });
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

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmployeeId(user.employeeId || '');
    setEditLat(user.locationSettings?.latitude?.toString() || '');
    setEditLng(user.locationSettings?.longitude?.toString() || '');
    setEditRadius(user.locationSettings?.radius?.toString() || '');
    setIsDialogOpen(true);
  };
  
  const handleSaveSettings = async () => {
      if (!editingUser) return;
      setIsSaving(true);
      try {
        const updateData: any = {
          name: editName,
          employeeId: editEmployeeId,
        };

        const latStr = editLat.trim().replace(',', '.');
        const lngStr = editLng.trim().replace(',', '.');
        const radiusStr = editRadius.trim();

        // Only update location if all three fields are provided
        if (latStr && lngStr && radiusStr) {
            const lat = Number(latStr);
            const lng = Number(lngStr);
            const radius = Number(radiusStr);

            if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
                toast({ title: 'Input Lokasi Tidak Valid', description: 'Pastikan Latitude, Longitude, dan Radius adalah angka yang valid.', variant: 'destructive' });
                setIsSaving(false);
                return;
            }
             updateData.locationSettings = {
                latitude: lat,
                longitude: lng,
                radius: radius,
            };
        } else if (latStr || lngStr || radiusStr) {
            // If some but not all fields are filled, show an error
            toast({ title: 'Input Lokasi Tidak Lengkap', description: 'Untuk mengatur lokasi, semua field (Latitude, Longitude, Radius) harus diisi.', variant: 'destructive' });
            setIsSaving(false);
            return;
        } else {
            // If all location fields are empty, remove the setting
            updateData.locationSettings = null;
        }

        const userRef = doc(db, 'users', editingUser.uid);
        await updateDoc(userRef, updateData);

        toast({ title: 'Pengaturan Disimpan', description: `Data untuk ${editingUser.name} telah diperbarui.` });
        await fetchUsers(); // Refresh the list
        setIsDialogOpen(false); // Close dialog

      } catch (error) {
        console.error("Error saving user settings:", error);
        toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan pengaturan.', variant: 'destructive'});
      } finally {
        setIsSaving(false);
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
                  <TableHead>ID Karyawan</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Lokasi Absensi</TableHead>
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
                            <AvatarImage src={user.faceprint || undefined} alt={user.name || ''} />
                            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.employeeId || 'N/A'}</TableCell>
                      <TableCell>{user.department || 'N/A'}</TableCell>
                       <TableCell>
                        {user.locationSettings ? (
                           <div className="text-xs">
                             <p>Lat: {user.locationSettings.latitude.toFixed(4)}</p>
                             <p>Lng: {user.locationSettings.longitude.toFixed(4)}</p>
                             <p>Radius: {user.locationSettings.radius}m</p>
                           </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Mengikuti Global</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2" />
                              Edit Pengguna
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Pengaturan Pengguna</DialogTitle>
                <DialogDescription>
                   Ubah detail dan lokasi absensi khusus untuk {editingUser?.name}. Biarkan lokasi kosong untuk menggunakan pengaturan global.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="employeeId">ID Karyawan</Label>
                    <Input id="employeeId" value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} />
                </div>
                <div className="space-y-2 pt-4 border-t">
                     <Label className="font-medium">Lokasi Absensi Khusus</Label>
                    <div className="space-y-2">
                        <Label htmlFor="lat" className="text-xs">Latitude</Label>
                        <Input id="lat" value={editLat} onChange={(e) => setEditLat(e.target.value)} type="text" placeholder="contoh: -6.200000" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="lng" className="text-xs">Longitude</Label>
                        <Input id="lng" value={editLng} onChange={(e) => setEditLng(e.target.value)} type="text" placeholder="contoh: 106.816666" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="radius" className="text-xs">Radius (meter)</Label>
                        <Input id="radius" value={editRadius} onChange={(e) => setEditRadius(e.target.value)} type="number" placeholder="contoh: 100" />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}

    
