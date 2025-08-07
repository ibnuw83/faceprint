
'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';


type Department = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export default function NewEmployeePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading, checkUserStatus, register } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [faceprintDataUrl, setFaceprintDataUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [selectedDepartmentData, setSelectedDepartmentData] = useState<Department | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
       toast({title: 'Akses Ditolak', description: 'Hanya admin yang dapat mengakses halaman ini.', variant: 'destructive'});
       router.replace('/dashboard');
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
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
  
   useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const frontCamera = videoDevices.find(d => d.label.toLowerCase().includes('front'));
          setSelectedCamera(frontCamera ? frontCamera.deviceId : videoDevices[0].deviceId);
        }

        stream.getTracks().forEach(track => track.stop());

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Akses Kamera Ditolak',
          description: 'Silakan izinkan akses kamera di pengaturan browser Anda.',
        });
      }
    };
    
    getCameraPermission();

  }, [toast]);

  useEffect(() => {
    let stream: MediaStream;
    if (selectedCamera && hasCameraPermission && videoRef.current && !faceprintDataUrl) {
        const startStream = async () => {
            if (videoRef.current?.srcObject) {
                const currentStream = videoRef.current.srcObject as MediaStream;
                currentStream.getTracks().forEach(track => track.stop());
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedCamera } }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error starting video stream for selected camera:", error);
            }
        };

        startStream();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [selectedCamera, hasCameraPermission, faceprintDataUrl]);


  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const targetWidth = 480;
      const scale = targetWidth / video.videoWidth;
      canvas.width = targetWidth;
      canvas.height = video.videoHeight * scale;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress image to reduce file size significantly
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFaceprintDataUrl(dataUrl);

        if(video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        toast({ title: "Gambar Diambil", description: "Gambar wajah berhasil ditangkap." });
      }
    }
  };

  const handleRetake = () => {
    setFaceprintDataUrl(null);
  };
  
  const handleDepartmentChange = (departmentId: string) => {
    const selectedDept = departments.find(d => d.id === departmentId);
    if (selectedDept) {
        setDepartment(selectedDept.name);
        setSelectedDepartmentData(selectedDept);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
      toast({ title: 'Departemen Diperlukan', description: 'Silakan pilih departemen.', variant: 'destructive' });
      return;
    }
     if (!faceprintDataUrl) {
      toast({ title: 'Pendaftaran Wajah Diperlukan', description: 'Silakan ambil gambar wajah.', variant: 'destructive'});
      return;
    }
    setIsLoading(true);

    try {
      // Check for duplicate employee ID
      const q = query(
        collection(db, 'users'),
        where('employeeId', '==', employeeId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: 'ID Karyawan Sudah Ada',
          description: `ID Karyawan "${employeeId}" sudah digunakan oleh pengguna lain.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Since this is an admin adding a new user, we call the register function from useAuth
      // This will create a new user in Firebase Authentication
      const newUserCredential = await register(email, password, fullName);
      const newUid = newUserCredential.user.uid;

      // Now, update the user's document in Firestore with all the details
      const userRef = doc(db, 'users', newUid);
      const userData: any = {
        name: fullName,
        email: email, // ensure email is saved
        employeeId: employeeId,
        department: department,
        isProfileComplete: true, // Profile is complete upon creation by admin
        faceprint: faceprintDataUrl,
        role: email.includes('admin') ? 'admin' : 'employee', // Assign role
      };

      if (selectedDepartmentData?.latitude && selectedDepartmentData?.longitude) {
        userData.locationSettings = {
          latitude: selectedDepartmentData.latitude,
          longitude: selectedDepartmentData.longitude,
          name: `Lokasi ${selectedDepartmentData.name}`,
        };
      }

      await setDoc(userRef, userData, { merge: true });

      toast({
        title: 'Karyawan Berhasil Ditambahkan',
        description: 'Profil karyawan baru telah berhasil disimpan.',
      });
      router.push('/employees');

    } catch (error: any) {
      console.error('Error adding new employee:', error);
      let errorMessage = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain.';
      }
       if (error.code === 'auth/weak-password') {
        errorMessage = 'Kata sandi terlalu lemah. Harap gunakan minimal 6 karakter.';
      }
      toast({
        title: 'Gagal Menambahkan',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || !user || user.role !== 'admin') {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const cardTitle = 'Tambah Karyawan Baru';
  const cardDescription = 'Buat akun dan profil untuk karyawan baru. Kata sandi yang dimasukkan akan menjadi kata sandi login mereka.';


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="text-primary" />
            {cardTitle}
          </CardTitle>
          <CardDescription>
            {cardDescription}
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
                <Label htmlFor="email">Alamat Email Login</Label>
                <Input id="email" type="email" placeholder="karyawan@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input id="password" type="password" placeholder="Minimal 6 karakter" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
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
                  <Select onValueChange={handleDepartmentChange} disabled={isLoading}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Pilih departemen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
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
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                 {faceprintDataUrl ? (
                   <Image src={faceprintDataUrl} alt="Hasil Gambar Wajah" layout="fill" objectFit="cover" />
                 ) : (
                   <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                 )}
                 <canvas ref={canvasRef} className="hidden"></canvas>
                  {hasCameraPermission === false && !faceprintDataUrl && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                      <Alert variant="destructive" className="w-auto">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Akses Kamera Ditolak</AlertTitle>
                        <AlertDescription>
                          Mohon izinkan akses kamera di browser Anda.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  {hasCameraPermission === null && !faceprintDataUrl && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-white">
                        <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                        Meminta izin kamera...
                    </div>
                  )}
              </div>
               {cameras.length > 1 && hasCameraPermission && !faceprintDataUrl && !isMobile && (
                <div className="space-y-2">
                  <Label htmlFor="cameraSelect">Pilih Kamera</Label>
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger id="cameraSelect">
                      <SelectValue placeholder="Pilih kamera..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map(camera => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Kamera ${cameras.indexOf(camera) + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 flex-col sm:flex-row">
                 {faceprintDataUrl ? (
                    <Button type="button" variant="outline" className="flex-1" onClick={handleRetake} disabled={isLoading}>
                      <RotateCcw className="mr-2" /> Ambil Ulang
                    </Button>
                 ) : (
                    <Button type="button" className="flex-1" onClick={handleCaptureFace} disabled={isLoading || !hasCameraPermission}>
                      <Camera className="mr-2" /> Ambil Gambar
                    </Button>
                 )}
                <Button type="button" variant="outline" className="flex-1" disabled={true}>
                  <Upload className="mr-2" /> Unggah Foto
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full !mt-4" disabled={isLoading || loadingDepartments || !faceprintDataUrl}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                    </>
                ) : (
                    'Simpan & Buat Akun Karyawan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
