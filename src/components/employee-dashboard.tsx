
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Clock, UserCheck, UserX, MapPin, Loader2, AlertTriangle, History } from 'lucide-react';
import { useAuth, User } from '@/hooks/use-auth';
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, limit, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { calculateDistance } from '@/lib/location';
import { verifyFaces } from '@/ai/flows/face-verifier';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import MotivationalQuote from './motivational-quote';
import RequiredLocation from './required-location';


type Location = {
  latitude: number;
  longitude: number;
};

type AttendanceRecord = {
  id: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
  createdAt: Timestamp;
};

type LocationSettings = {
    latitude: number;
    longitude: number;
    radius: number;
} | null;


type ScheduleSettings = {
    clockInTime: string;
    clockOutTime: string;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user, checkUserStatus } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [effectiveLocationSettings, setEffectiveLocationSettings] = useState<LocationSettings>(null);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  
  const [isClockInAllowed, setIsClockInAllowed] = useState(true);
  const [isClockOutAllowed, setIsClockOutAllowed] = useState(true);

  const fetchAttendanceHistory = useCallback(async (employeeId: string) => {
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', employeeId),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));

      // Sort the results on the client-side to avoid needing a composite index
      history.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      setAttendanceHistory(history);
      
    } catch (error) {
      console.error("Error fetching attendance history: ", error);
       if ((error as any).code === 'failed-precondition') {
          toast({
            title: 'Gagal Memuat Riwayat',
            description: 'Indeks Firestore yang diperlukan untuk melihat riwayat belum dibuat. Silakan hubungi admin.',
            variant: 'destructive',
            duration: 10000,
          });
      } else {
          toast({
            title: 'Gagal Memuat Riwayat',
            description: 'Terjadi kesalahan saat mengambil data absensi Anda.',
            variant: 'destructive',
          });
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);


  // Effect for fetching all settings and history
  useEffect(() => {
    if (!user) return;

    const fetchAllSettings = async () => {
        setIsLoadingSettings(true);
        try {
            // 1. Fetch schedule settings
            const scheduleRef = doc(db, 'settings', 'schedule');
            const scheduleSnap = await getDoc(scheduleRef);
            setScheduleSettings(scheduleSnap.exists() ? scheduleSnap.data() as ScheduleSettings : null);

            // 2. Determine effective location settings (user > global)
            if (user.locationSettings && user.locationSettings.latitude != null && user.locationSettings.longitude != null && user.locationSettings.radius != null) {
                setEffectiveLocationSettings(user.locationSettings);
            } else {
                const globalLocationRef = doc(db, 'settings', 'location');
                const globalLocationSnap = await getDoc(globalLocationRef);
                if (globalLocationSnap.exists()) {
                    const data = globalLocationSnap.data();
                    if (data.latitude != null && data.longitude != null && data.radius != null) {
                        setEffectiveLocationSettings({
                            latitude: Number(data.latitude),
                            longitude: Number(data.longitude),
                            radius: Number(data.radius),
                        });
                    } else {
                        setEffectiveLocationSettings(null);
                    }
                } else {
                    setEffectiveLocationSettings(null);
                }
            }

            // 3. Fetch attendance history
            if (user.employeeId) {
                await fetchAttendanceHistory(user.employeeId);
            } else {
                setLoadingHistory(false);
            }

        } catch (error) {
            console.error("Failed to load settings:", error);
            toast({
                title: "Gagal Memuat Pengaturan",
                description: "Tidak dapat memuat pengaturan jadwal atau lokasi.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingSettings(false);
        }
    };

    fetchAllSettings();

  }, [user, fetchAttendanceHistory, toast]);


  // Effect for handling time-based logic (scheduling)
  useEffect(() => {
    const updateTimeChecks = () => {
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        let clockInEnabled = true;
        let clockOutEnabled = true;

        if (scheduleSettings) {
             if (scheduleSettings.clockInTime) {
                const [inHours, inMinutes] = scheduleSettings.clockInTime.split(':').map(Number);
                const clockInStartTime = inHours * 60 + inMinutes;
                // Allow clocking in for a 4-hour window
                clockInEnabled = currentTimeInMinutes >= clockInStartTime && currentTimeInMinutes <= clockInStartTime + (4 * 60);
            } else {
                 clockInEnabled = true;
            }

            if (scheduleSettings.clockOutTime) {
                const [outHours, outMinutes] = scheduleSettings.clockOutTime.split(':').map(Number);
                const clockOutStartTime = outHours * 60 + outMinutes;
                clockOutEnabled = currentTimeInMinutes >= clockOutStartTime;
            } else {
                clockOutEnabled = true;
            }
        }
        
        setIsClockInAllowed(clockInEnabled);
        setIsClockOutAllowed(clockOutEnabled);
    };
    
    // Run once on load, then set an interval
    updateTimeChecks();
    const timerId = setInterval(updateTimeChecks, 60000); // Check every minute

    return () => clearInterval(timerId);
  }, [scheduleSettings]);

  // Effect for getting camera permissions and listing devices
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
          setSelectedCamera(videoDevices[0].deviceId);
        }
        
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
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
  
  // Effect for handling the video stream itself
  useEffect(() => {
    let stream: MediaStream;
    if (selectedCamera && hasCameraPermission && videoRef.current) {
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
            } catch(error) {
                console.error("Error starting video stream:", error);
                 toast({
                    variant: 'destructive',
                    title: 'Gagal Memulai Kamera',
                    description: 'Tidak dapat memulai stream video. Coba pilih kamera lain jika tersedia.',
                });
            }
        };

        startStream();

        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [selectedCamera, hasCameraPermission, toast]);


  const getLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Gagal mendapatkan lokasi: ${error.message}`));
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const recordAttendance = async (clockStatus: 'Clocked In' | 'Clocked Out') => {
    if (!user || !user.faceprint || !user.employeeId) {
       toast({ title: 'Profil Belum Lengkap', description: 'Wajah atau ID Karyawan Anda belum terdaftar. Silakan lengkapi profil Anda.', variant: 'destructive'});
       return;
    }
    if (!hasCameraPermission) {
        toast({ title: 'Kamera Diperlukan', description: 'Akses kamera diperlukan untuk absen.', variant: 'destructive'});
        return;
    }
    if (!videoRef.current || !canvasRef.current) {
        toast({ title: 'Error Kamera', description: 'Komponen kamera tidak siap.', variant: 'destructive'});
        return;
    }
    if (isLoadingSettings) {
        toast({ title: 'Pengaturan Belum Siap', description: 'Pengaturan lokasi masih dimuat, mohon tunggu sebentar.', variant: 'destructive'});
        return;
    }

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const captureToVerify = canvas.toDataURL('image/jpeg', 0.9);
      
      toast({ title: 'Memverifikasi Wajah...', description: 'Mohon tunggu, AI sedang memproses gambar Anda.' });

      const verificationResult = await verifyFaces({
        registeredFace: user.faceprint,
        captureToVerify: captureToVerify,
      });

      if (!verificationResult.match) {
        throw new Error('Verifikasi wajah gagal. Pastikan wajah Anda terlihat jelas dan coba lagi.');
      }
      
      toast({ title: 'Wajah Terverifikasi!', description: 'Mencatat absensi tanpa validasi lokasi (sementara).', variant: 'default' });
      
      // Temporarily disable location check
      /*
      const currentLocation = await getLocation();

      if(effectiveLocationSettings) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            effectiveLocationSettings.latitude,
            effectiveLocationSettings.longitude
          );

          if (distance > effectiveLocationSettings.radius) {
            throw new Error(`Anda berada ${distance.toFixed(0)} meter dari lokasi yang diizinkan. Anda harus berada dalam radius ${effectiveLocationSettings.radius} meter untuk absen.`);
          }
      } else {
           toast({ title: 'Peringatan Lokasi', description: 'Pengaturan lokasi tidak ditemukan. Absen dicatat tanpa validasi lokasi.', variant: 'default' });
      }
      */
      
      const now = new Date();
      const currentLocation = { latitude: 0, longitude: 0 }; // Dummy location

      await addDoc(collection(db, 'attendance'), {
        employeeId: user.employeeId,
        employeeName: user.name,
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        status: clockStatus,
        location: currentLocation,
        createdAt: Timestamp.fromDate(now),
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastLocation: currentLocation });
      await checkUserStatus();
      
      toast({
        title: `Absen ${clockStatus === 'Clocked In' ? 'Masuk' : 'Keluar'} Berhasil`,
        description: `Kehadiran Anda telah dicatat.`,
      });

      if (user.employeeId) {
        await fetchAttendanceHistory(user.employeeId);
      }

    } catch (error: any) {
      toast({
        title: `Gagal Absen ${clockStatus === 'Clocked In' ? 'Masuk' : 'Keluar'}`,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const statusLocale: Record<string, string> = {
    'Clocked In': 'Masuk',
    'Clocked Out': 'Keluar',
  }
  
  const buttonsDisabled = isProcessing || !hasCameraPermission || isLoadingSettings;

  return (
    <div className="container mx-auto max-w-4xl p-0 md:p-0 lg:p-0 space-y-8">
      <MotivationalQuote />
      <RequiredLocation />
      <Card className="shadow-lg rounded-xl">
        <CardHeader className='flex-row items-center justify-between'>
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Camera className="text-primary" />
              Otentikasi Wajah
            </CardTitle>
            <CardDescription>Posisikan wajah Anda di dalam bingkai untuk absen masuk atau keluar.</CardDescription>
          </div>
           <Dialog>
             <DialogTrigger asChild>
                <Button variant="outline">
                    <History className="mr-2" /> Lihat Riwayat
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                <DialogTitle>Riwayat Absensi Anda</DialogTitle>
                <DialogDescription>
                    Berikut adalah 10 catatan absensi terakhir Anda yang tersimpan di sistem.
                </DialogDescription>
                </DialogHeader>
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
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="w-80 h-80 aspect-square rounded-full overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden"></canvas>
              {hasCameraPermission === null ? (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-white">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    Meminta izin kamera...
                </div>
              ) : !hasCameraPermission && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                <Alert variant="destructive" className="w-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Akses Kamera Diperlukan</AlertTitle>
                  <AlertDescription>
                    Mohon izinkan akses kamera di pengaturan browser Anda.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
            {cameras.length > 1 && hasCameraPermission && (
              <div className="w-full max-w-sm space-y-2">
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

          <div className="flex gap-4 w-full flex-col sm:flex-row max-w-sm">
            <Button onClick={() => recordAttendance('Clocked In')} size="lg" className="flex-1" disabled={buttonsDisabled || !isClockInAllowed}>
              {isProcessing || isLoadingSettings ? <Loader2 className="mr-2 animate-spin" /> : <UserCheck className="mr-2" />}
              Absen Masuk
            </Button>
            <Button onClick={() => recordAttendance('Clocked Out')} size="lg" className="flex-1" variant="secondary" disabled={buttonsDisabled || !isClockOutAllowed}>
                {isProcessing || isLoadingSettings ? <Loader2 className="mr-2 animate-spin" /> : <UserX className="mr-2" />}
              Absen Keluar
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}


