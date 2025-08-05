'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function NewEmployeePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // For simplicity, we'll use a placeholder password for admin-created users.
  // In a real application, you would want a more secure way to handle this,
  // such as sending a password reset email.
  const placeholderPassword = 'password123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, placeholderPassword);
      const user = userCredential.user;

      // Update user profile in Auth
      await updateProfile(user, { displayName: fullName });

      // Save user details to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: fullName,
        employeeId: employeeId,
        email: email,
        department: department,
        role: 'employee', // All users created here are employees by default
        createdAt: new Date(),
      });

      toast({
        title: 'Karyawan Terdaftar',
        description: 'Karyawan baru telah berhasil ditambahkan ke sistem.',
      });
      router.push('/employees');

    } catch (error: any) {
      console.error('Error mendaftarkan karyawan:', error);
      toast({
        title: 'Pendaftaran Gagal',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="text-primary" />
            Daftarkan Karyawan Baru
          </CardTitle>
          <CardDescription>
            Masukkan detail karyawan dan ambil foto wajah mereka untuk otentikasi biometrik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input id="fullName" placeholder="contoh: John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">ID Karyawan</Label>
                <Input id="employeeId" placeholder="contoh: EMP12345" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                <Input id="department" placeholder="contoh: Engineering" required value={department} onChange={(e) => setDepartment(e.target.value)} disabled={isLoading} />
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
              <Button type="submit" size="lg" className="w-full !mt-4" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mendaftarkan...
                    </>
                ) : (
                    'Daftarkan Karyawan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
