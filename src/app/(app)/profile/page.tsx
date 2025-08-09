
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Building, Briefcase, Loader2, MapPin, History, Camera, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AttendanceRecord = {
  id: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};

type Department = {
  id: string;
  name: string;
};

export default function ProfilePage() {
  const { user, loading, checkUserStatus } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [faceprintDataUrl, setFaceprintDataUrl] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // Set initial state based on user data
  useEffect(() => {
    if (user) {
      if (!user.isProfileComplete) {
        setIsEditing(true);
      }
      setName(user.name || '');
      setEmployeeId(user.employeeId || '');
      setDepartment(user.department || '');
      setFaceprintDataUrl(user.faceprint || null);
    }
  }, [user]);

  // Fetch departments for the select dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const departmentsCollection = collection(db, 'departments');
        const departmentSnapshot = await getDocs(departmentsCollection);
        const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
        setDepartments(departmentList);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch attendance history
  const fetchHistory = useCallback(async () => {
    if (!user?.uid) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendanceHistory(history);
    } catch (e) {
      console.error("Error fetching attendance history: ", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Initialize camera
  useEffect(() => {
    async function setupCamera() {
      if (!isEditing || faceprintDataUrl) return; // Only setup if editing and no picture taken yet
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
      }
    }
    setupCamera();

    // Cleanup function to stop camera stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isEditing, faceprintDataUrl]);


  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFaceprintDataUrl(dataUrl);
        toast({ title: "Gambar Diambil", description: "Gambar wajah berhasil ditangkap." });
        // Stop the camera stream
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleRetake = () => {
    setFaceprintDataUrl(null); // This will trigger the useEffect to restart the camera
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    if (!name.trim() || !employeeId.trim() || !department) {
        toast({ title: 'Data Tidak Lengkap', description: 'Nama, ID Karyawan, dan Departemen wajib diisi.', variant: 'destructive' });
        return;
    }
    if (!faceprintDataUrl) {
        toast({ title: 'Foto Wajah Diperlukan', description: 'Silakan ambil foto wajah Anda.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        employeeId: employeeId.trim(),
        department: department,
        faceprint: faceprintDataUrl,
        isProfileComplete: true,
      });

      toast({ title: 'Profil Diperbarui', description: 'Informasi profil Anda telah berhasil disimpan.' });
      await checkUserStatus(); // Refresh user state from auth provider
      setIsEditing(false); // Exit editing mode
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan profil Anda.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  };

  if (loading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {isEditing && (
         <Alert variant="default" className='max-w-4xl mx-auto border-primary/40 bg-primary/5'>
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertTitle className='text-primary font-bold'>Lengkapi Profil Anda</AlertTitle>
          <AlertDescription>
            Selamat datang! Untuk melanjutkan, harap lengkapi detail profil Anda dan daftarkan wajah Anda untuk sistem absensi.
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 border-4 border-primary">
                <AvatarImage src={faceprintDataUrl || undefined} alt={name || 'User Avatar'} />
                <AvatarFallback className="text-3xl">{name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                 <CardTitle className="text-3xl font-bold">{isEditing ? 'Lengkapi Profil' : name}</CardTitle>
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
                           <Input id='fullName' value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing || isSubmitting}/>
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
                           <Input id='employeeId' value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder='e.g. EMP123' disabled={!isEditing || isSubmitting}/>
                        </div>
                     </div>
                       <div className="space-y-1">
                        <Label htmlFor='department'>Departemen</Label>
                        <div className='flex items-center gap-2'>
                           <Building className='text-muted-foreground'/>
                           {isEditing ? (
                              loadingDepartments ? <Skeleton className="h-10 w-full" /> : 
                              <Select onValueChange={setDepartment} value={department} disabled={!isEditing || isSubmitting}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih departemen..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                           ) : (
                               <Input id='department' value={department || 'N/A'} disabled/>
                           )}
                        </div>
                     </div>
                </div>
            </div>
            <div className="space-y-6">
                 <h3 className="font-semibold text-xl border-b pb-2">Foto Wajah Terdaftar</h3>
                 {isEditing ? (
                    <div className="space-y-4">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                            {faceprintDataUrl ? (
                                <Image src={faceprintDataUrl} alt="Hasil Gambar Wajah" layout="fill" objectFit="cover" />
                            ) : (
                                <>
                                 <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                 {hasCameraPermission === false && (
                                     <p className="absolute text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
                                        Kamera tidak diizinkan. Mohon izinkan akses kamera pada browser Anda.
                                     </p>
                                 )}
                                </>
                            )}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                        <div className='flex gap-2'>
                            {faceprintDataUrl ? (
                                <Button onClick={handleRetake} variant="outline" className='flex-1' disabled={isSubmitting}><RotateCcw/> Ambil Ulang</Button>
                            ) : (
                                <Button onClick={handleCaptureFace} className='flex-1' disabled={!hasCameraPermission || isSubmitting}><Camera/> Ambil Gambar</Button>
                            )}
                        </div>
                    </div>
                 ) : (
                    faceprintDataUrl ? (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                            <Image src={faceprintDataUrl} alt="Foto Wajah Terdaftar" layout="fill" objectFit="cover" />
                        </div>
                    ) : (
                        <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">Belum ada foto wajah terdaftar.</p>
                        </div>
                    )
                 )}
            </div>
        </CardContent>
        {isEditing && (
            <CardFooter>
                 <Button onClick={handleSaveChanges} className='w-full' size="lg" disabled={isSubmitting || !faceprintDataUrl}>
                    {isSubmitting ? <Loader2 className='animate-spin mr-2'/> : <Save className='mr-2' />}
                    Simpan dan Selesaikan Profil
                </Button>
            </CardFooter>
        )}
      </Card>
      
      {!isEditing && (
        <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <History className="text-primary"/>
                    Riwayat Absensi Saya
                </CardTitle>
                <CardDescription>5 catatan absensi terakhir Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-y-auto max-h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingHistory ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : attendanceHistory.length > 0 ? (
                            attendanceHistory.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>{record.time}</TableCell>
                                    <TableCell className="text-right">
                                    <Badge
                                        variant={record.status === 'Clocked In' ? 'default' : 'secondary'}
                                        className={
                                        record.status === 'Clocked In'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
                                        }
                                    >
                                        {statusLocale[record.status] || record.status}
                                    </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        Belum ada riwayat absensi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
