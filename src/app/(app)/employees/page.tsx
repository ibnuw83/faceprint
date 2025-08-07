
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
import { Users, PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, History, User as UserIcon, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


type LocationSettings = {
    latitude: number;
    longitude: number;
    radius: number;
    name?: string;
}

type Schedule = Record<string, { clockIn: string; clockOut: string }>;

type User = {
  uid: string;
  name: string;
  email: string;
  companyId: string;
  department?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  role: 'admin' | 'employee';
  employeeId?: string;
  faceprint?: string;
  locationSettings?: LocationSettings;
  schedule?: Schedule;
};

const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const initialSchedule: Schedule = daysOfWeek.reduce((acc, day) => {
    acc[day] = { clockIn: '', clockOut: '' };
    return acc;
}, {} as Schedule);


export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for the edit form
  const [editName, setEditName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRadius, setEditRadius] = useState('');
  const [editLocationName, setEditLocationName] = useState('');
  const [editSchedule, setEditSchedule] = useState<Schedule>(initialSchedule);


  const fetchUsers = useCallback(async () => {
    if (!authUser?.companyId) return;
    setLoading(true);
    try {
      const usersCollection = collection(db, `companies/${authUser.companyId}/users`);
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
  }, [toast, authUser?.companyId]);

  useEffect(() => {
    if (authUser?.role === 'admin') {
      fetchUsers();
    }
  }, [authUser, fetchUsers]);

  const handleDeleteUser = async (userToDelete: User) => {
    if (!authUser?.companyId) return;
    setDeletingId(userToDelete.uid);
    try {
      const batch = writeBatch(db);
      
      // Delete user from company subcollection
      const userRef = doc(db, `companies/${authUser.companyId}/users`, userToDelete.uid);
      batch.delete(userRef);

      // Delete user from top-level mapping collection
      const userMappingRef = doc(db, 'users', userToDelete.uid);
      batch.delete(userMappingRef);
      
      await batch.commit();
      
      toast({
        title: 'Pengguna Dihapus',
        description: 'Profil pengguna telah berhasil dihapus dari sistem.',
      });
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: 'Gagal Menghapus Pengguna',
        description: 'Pengguna tidak dapat dihapus saat ini. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };


  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmployeeId(user.employeeId || '');
    setEditLat(user.locationSettings?.latitude?.toString() || '');
    setEditLng(user.locationSettings?.longitude?.toString() || '');
    setEditRadius(user.locationSettings?.radius?.toString() || '');
    setEditLocationName(user.locationSettings?.name || '');
    
    // Populate schedule, ensuring all days are present
    const newSchedule = { ...initialSchedule };
    if (user.schedule) {
        for (const day of daysOfWeek) {
            if (user.schedule[day]) {
                newSchedule[day] = user.schedule[day];
            }
        }
    }
    setEditSchedule(newSchedule);

    setIsDialogOpen(true);
  };

  const handleScheduleChange = (day: string, type: 'clockIn' | 'clockOut', value: string) => {
    setEditSchedule(prev => ({
        ...prev,
        [day]: {
            ...prev[day],
            [type]: value,
        },
    }));
  };
  
  const handleSaveSettings = async () => {
      if (!editingUser || !authUser?.companyId) return;
      
      const newEmployeeId = editEmployeeId.trim();
      if (!newEmployeeId) {
        toast({ title: 'ID Karyawan Wajib Diisi', description: 'ID Karyawan tidak boleh kosong.', variant: 'destructive'});
        return;
      }

      setIsSaving(true);
      try {
        // Check for duplicate employee ID if it has changed
        if (newEmployeeId !== editingUser.employeeId) {
            const q = query(collection(db, `companies/${authUser.companyId}/users`), where('employeeId', '==', newEmployeeId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                toast({
                    title: 'ID Karyawan Sudah Ada',
                    description: `ID Karyawan "${newEmployeeId}" sudah digunakan oleh pengguna lain.`,
                    variant: 'destructive',
                });
                setIsSaving(false);
                return;
            }
        }


        const updateData: any = {
          name: editName,
          employeeId: newEmployeeId,
          schedule: editSchedule,
        };

        const latStr = editLat.trim().replace(',', '.');
        const lngStr = editLng.trim().replace(',', '.');
        const radiusStr = editRadius.trim();

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
                name: editLocationName.trim() || null,
             };
        } else if (latStr || lngStr || radiusStr || editLocationName.trim()) {
            toast({ title: 'Input Lokasi Tidak Lengkap', description: 'Untuk mengatur lokasi, semua field lokasi (Latitude, Longitude, Radius) harus diisi.', variant: 'destructive' });
            setIsSaving(false);
            return;
        } else {
            // If all location fields are empty, remove the setting by setting it to null
            updateData.locationSettings = null;
        }

        const userRef = doc(db, `companies/${authUser.companyId}/users`, editingUser.uid);
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
            <Link href="/employees/new-employee">
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
                        {user.locationSettings?.latitude ? (
                           <div className="text-xs">
                             <p className='font-bold'>{user.locationSettings.name || 'Lokasi Khusus'}</p>
                             <p>Lat: {user.locationSettings.latitude.toFixed(4)}</p>
                             <p>Lng: {user.locationSettings.longitude.toFixed(4)}</p>
                             {user.locationSettings.radius && <p>Radius: {user.locationSettings.radius}m</p>}
                           </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Mengikuti Departemen/Global</span>
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
                             <DropdownMenuItem onClick={() => router.push(`/employees/${user.uid}/profile`)}>
                                <UserIcon className="mr-2"/>
                                Lihat Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2" />
                              Edit Pengguna & Jadwal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/employees/${user.uid}/attendance`)}>
                                <History className="mr-2"/>
                                Lihat Riwayat Absensi
                            </DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2" /> Hapus
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus pengguna <strong>{user.name}</strong>? Tindakan ini tidak dapat diurungkan dan akan menghapus profil pengguna dari sistem.
                                        <br/><br/>
                                        <strong className="text-destructive">Penting:</strong> Tindakan ini tidak menghapus akun login pengguna. Untuk menghapus akun secara permanen, Anda harus melakukannya melalui Firebase Console.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteUser(user)}
                                        className="bg-destructive hover:bg-destructive/90"
                                        disabled={!!deletingId}
                                    >
                                        {deletingId === user.uid ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Ya, Hapus'}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Edit Pengaturan Pengguna</DialogTitle>
                <DialogDescription>
                   Ubah detail, lokasi, dan jadwal absensi khusus untuk {editingUser?.name}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 py-4">
               {/* Column 1: User Details & Location */}
                <div className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <Label className="font-medium text-base">Detail Pengguna</Label>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">ID Karyawan</Label>
                            <Input id="employeeId" value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-4 p-4 border rounded-lg">
                        <Label className="font-medium text-base">Lokasi Absensi Khusus (Override)</Label>
                        <p className="text-xs text-muted-foreground">Kosongkan semua field lokasi untuk mengikuti aturan departemen/global.</p>
                        <div className="space-y-2">
                            <Label htmlFor="locName" className="text-xs">Nama Lokasi</Label>
                            <Input id="locName" value={editLocationName} onChange={(e) => setEditLocationName(e.target.value)} type="text" placeholder="contoh: Proyek Site A" />
                        </div>
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

                {/* Column 2: Schedule */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium text-base flex items-center gap-2"><Clock /> Jadwal Absensi Khusus</h3>
                    <p className="text-xs text-muted-foreground">
                        Atur jadwal spesifik untuk pengguna ini. Kosongkan jika hari libur atau mengikuti jadwal global.
                    </p>
                    <div className="space-y-3">
                        {daysOfWeek.map(day => (
                            <div key={day} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2 p-2 border-b last:border-b-0">
                                <Label className="font-medium sm:col-span-1">{day}</Label>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor={`clockIn-${day}`} className="text-xs text-muted-foreground">Masuk</Label>
                                    <Input
                                        id={`clockIn-${day}`}
                                        type="time"
                                        value={editSchedule[day]?.clockIn || ''}
                                        onChange={e => handleScheduleChange(day, 'clockIn', e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                <Label htmlFor={`clockOut-${day}`} className="text-xs text-muted-foreground">Pulang</Label>
                                    <Input
                                        id={`clockOut-${day}`}
                                        type="time"
                                        value={editSchedule[day]?.clockOut || ''}
                                        onChange={e => handleScheduleChange(day, 'clockOut', e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        ))}
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
