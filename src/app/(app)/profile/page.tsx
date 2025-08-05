
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Building, Briefcase, Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 border-4 border-primary">
                <AvatarImage src={user.faceprint || undefined} alt={user.name || 'User Avatar'} />
                <AvatarFallback className="text-3xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                 <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{user.role === 'admin' ? 'Administrator' : 'Karyawan'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
                <h3 className="font-semibold text-xl border-b pb-2">Detail Akun</h3>
                <div className="space-y-4">
                     <div className="space-y-1">
                        <Label htmlFor='fullName'>Nama Lengkap</Label>
                        <div className='flex items-center gap-2'>
                           <User className='text-muted-foreground'/>
                           <Input id='fullName' value={user.name || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='email'>Alamat Email</Label>
                        <div className='flex items-center gap-2'>
                           <Mail className='text-muted-foreground'/>
                           <Input id='email' value={user.email || ''} disabled/>
                        </div>
                     </div>
                      <div className="space-y-1">
                        <Label htmlFor='employeeId'>ID Karyawan</Label>
                        <div className='flex items-center gap-2'>
                           <Briefcase className='text-muted-foreground'/>
                           <Input id='employeeId' value={user.employeeId || 'N/A'} disabled/>
                        </div>
                     </div>
                       <div className="space-y-1">
                        <Label htmlFor='department'>Departemen</Label>
                        <div className='flex items-center gap-2'>
                           <Building className='text-muted-foreground'/>
                           <Input id='department' value={user.department || 'N/A'} disabled/>
                        </div>
                     </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                   <h3 className="font-semibold text-xl border-b pb-2 flex items-center gap-2">
                     <MapPin />
                     Lokasi Absensi Khusus
                   </h3>
                   {user.locationSettings && user.locationSettings.latitude != null && user.locationSettings.longitude != null && user.locationSettings.radius != null ? (
                      <div className="space-y-4">
                         <div className="space-y-1">
                           <Label htmlFor='latitude'>Latitude</Label>
                           <Input id='latitude' value={user.locationSettings.latitude} disabled />
                         </div>
                         <div className="space-y-1">
                           <Label htmlFor='longitude'>Longitude</Label>
                           <Input id='longitude' value={user.locationSettings.longitude} disabled />
                         </div>
                         <div className="space-y-1">
                           <Label htmlFor='radius'>Radius (meter)</Label>
                           <Input id='radius' value={user.locationSettings.radius} disabled />
                         </div>
                      </div>
                   ) : (
                      <p className="text-sm text-muted-foreground italic">Mengikuti pengaturan lokasi global.</p>
                   )}
                </div>
            </div>
            <div className="space-y-6">
                 <h3 className="font-semibold text-xl border-b pb-2">Foto Wajah Terdaftar</h3>
                 {user.faceprint ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                        <Image src={user.faceprint} alt="Foto Wajah Terdaftar" layout="fill" objectFit="cover" />
                    </div>
                 ) : (
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Belum ada foto wajah terdaftar.</p>
                    </div>
                 )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
