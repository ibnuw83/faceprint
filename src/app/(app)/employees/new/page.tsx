
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton';

type Department = {
  id: string;
  name: string;
};

export default function CompleteProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading, checkUserStatus } = useAuth();

  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // Pre-fill name from auth, but allow user to change it if needed.
      setFullName(user.name || '');
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsCollection = collection(db, 'departments');
        const departmentSnapshot = await getDocs(departmentsCollection);
        const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        setDepartments(departmentList);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: 'Gagal Memuat Departemen',
          description: 'Tidak dapat memuat daftar departemen.',
          variant: 'destructive',
        });
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'Anda harus login terlebih dahulu.', variant: 'destructive' });
      return;
    }
    if (!department) {
      toast({ title: 'Departemen Diperlukan', description: 'Silakan pilih departemen.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: fullName,
        employeeId: employeeId,
        department: department,
        isProfileComplete: true, // Mark profile as complete
      });

      // Refresh the auth state to get the latest user data
      await checkUserStatus();

      toast({
        title: 'Profil Diperbarui',
        description: 'Data Anda telah berhasil disimpan.',
      });
      router.push('/dashboard'); // Redirect to dashboard after completion

    } catch (error: any) {
      console.error('Error memperbarui profil:', error);
      toast({
        title: 'Gagal Memperbarui',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // To avoid flash of content while auth is loading or redirecting
  if (authLoading || !user) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="text-primary" />
            Lengkapi Profil Anda
          </CardTitle>
          <CardDescription>
            Masukkan detail Anda dan daftarkan wajah untuk menyelesaikan pengaturan akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input id="fullName" placeholder="contoh: John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">ID Karyawan</Label>
                <Input id="employeeId" placeholder="contoh: EMP12345" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                {loadingDepartments ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select onValueChange={setDepartment} value={department} disabled={isLoading}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Pilih departemen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-" disabled>Tidak ada departemen tersedia</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="space-y-4 flex flex-col">
              <Label>Pendaftaran Wajah</Label>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                <Image src="https://placehold.co/400x400" alt="Placeholder pengambilan wajah" layout="fill" objectFit="cover" data-ai-hint="person face" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <p className="text-white/90 font-semibold backdrop-blur-sm p-2 rounded-md">Area Pengambilan Wajah</p>
                </div>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button type="button" variant="outline" className="flex-1" disabled={isLoading}>
                  <Camera className="mr-2" /> Gunakan Kamera
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled={isLoading}>
                  <Upload className="mr-2" /> Unggah Foto
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full !mt-4" disabled={isLoading || loadingDepartments}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                    </>
                ) : (
                    'Daftar dan Selesaikan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

