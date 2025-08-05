'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function NewEmployeePage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Karyawan Terdaftar',
      description: 'Karyawan baru telah berhasil ditambahkan ke sistem.',
    });
    router.push('/employees');
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
                <Input id="fullName" placeholder="contoh: John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">ID Karyawan</Label>
                <Input id="employeeId" placeholder="contoh: EMP12345" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                <Input id="department" placeholder="contoh: Engineering" required />
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
                <Button type="button" variant="outline" className="flex-1">
                  <Camera className="mr-2" /> Gunakan Kamera
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  <Upload className="mr-2" /> Unggah Foto
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full !mt-4">
                Daftarkan Karyawan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
