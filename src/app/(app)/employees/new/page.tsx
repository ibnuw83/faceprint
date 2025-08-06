
'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload, Loader2, AlertTriangle, Video, RotateCcw } from 'lucide-react';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';


type Department = {
  id: string;
  name: string;
};

export default function CompleteProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading, checkUserStatus } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fullName, setFullName] = useState('');
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
  
   useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera not supported on this browser');
        setHasCameraPermission(false);
        return;
      }
      try {
        // First, get permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        
        // Then, enumerate devices to get the list of cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const frontCamera = videoDevices.find(d => d.label.toLowerCase().includes('front'));
          setSelectedCamera(frontCamera ? frontCamera.deviceId : videoDevices[0].deviceId);
        }

        // Stop the initial stream, we'll start a new one with the selected device
        stream.getTracks().forEach(track => track.stop());

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Akses Kamera Ditolak',
          description: 'Silakan izinkan akses kamera di pengaturan browser Anda untuk menggunakan fitur ini.',
        });
      }
    };
    
    getCameraPermission();

  }, [toast]);

  useEffect(() => {
    // Effect to start/restart stream when selectedCamera changes
    if (selectedCamera && hasCameraPermission && videoRef.current && !faceprintDataUrl) {
        let stream: MediaStream;
        const startStream = async () => {
             // Stop any existing stream
            if (videoRef.current?.srcObject) {
                const currentStream = videoRef.current.srcObject as MediaStream;
                currentStream.getTracks().forEach(track => track.stop());
            }

            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: selectedCamera } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        };

        startStream();

        return () => {
            // Cleanup: stop the stream when component unmounts or selected camera changes
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
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the canvas
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data as a base64 string
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
      setFaceprintDataUrl(dataUrl);

      // Stop the video stream
      if(video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }

      toast({ title: "Gambar Diambil", description: "Gambar wajah Anda telah berhasil ditangkap." });
    }
  };

  const handleRetake = () => {
    setFaceprintDataUrl(null);
    // The useEffect will restart the camera stream since faceprintDataUrl is now null
  };

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
     if (!faceprintDataUrl) {
      toast({ title: 'Pendaftaran Wajah Diperlukan', description: 'Silakan ambil gambar wajah Anda.', variant: 'destructive'});
      return;
    }
    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: fullName,
        employeeId: employeeId,
        department: department,
        role: user.role, 
        isProfileComplete: true,
        faceprint: faceprintDataUrl, // Save the captured face
      });

      // Refresh the auth state to get the latest user data
      await checkUserStatus();

      toast({
        title: 'Profil Berhasil Disimpan',
        description: 'Data dan wajah Anda telah berhasil disimpan.',
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
                    'Simpan Profil & Selesaikan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    
