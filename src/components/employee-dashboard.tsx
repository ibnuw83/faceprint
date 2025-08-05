
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Clock, UserCheck, UserX, MapPin, Loader2, AlertTriangle, History } from 'lucide-react';
import { useAuth, User } from '@/hooks/use-auth';
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, limit, getDoc, Timestamp } from 'firebase/firestore';
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
}

type ScheduleSettings = {
    clockInTime: string;
    clockOutTime: string;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user, checkUserStatus } = useAuth();
  const [status, setStatus] = useState<'in' | 'out' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  const [isClockInAllowed, setIsClockInAllowed] = useState(true);
  const [isClockOutAllowed, setIsClockOutAllowed] = useState(false);


  const fetchAttendanceHistory = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
        .sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);

      setAttendanceHistory(history);
      
      if (history.length > 0) {
        const lastRecord = history[0];
        if (lastRecord.date === new Date().toLocaleDateString('id-ID')) {
            if (lastRecord.status === 'Clocked In') {
                setStatus('in');
            } else {
                setStatus('out');
            }
        } else {
            setStatus(null);
        }
      } else {
        setStatus(null);
      }

    } catch (error) {
      console.error("Error fetching attendance history: ", error);
      // This is a common error if the composite index is not created yet.
      // We will show a more helpful message.
      if ((error as any).code === 'failed-precondition') {
          toast({
            title: 'Indeks Firestore Diperlukan',
            description: 'Fitur riwayat memerlukan indeks. Harap minta admin untuk membuatnya di konsol Firebase.',
            variant: 'destructive',
          });
      } else {
          toast({
            title: 'Gagal memuat riwayat',
            description: 'Tidak dapat mengambil data absensi Anda.',
            variant: 'destructive',
          });
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchScheduleSettings = async () => {
        try {
            const scheduleRef = doc(db, 'settings', 'schedule');
            const scheduleSnap = await getDoc(scheduleRef);
            if (scheduleSnap.exists()) {
                setScheduleSettings(scheduleSnap.data() as ScheduleSettings);
            }
        } catch (error) {
            console.error("Error fetching schedule settings:", error);
        }
    }

    fetchScheduleSettings();
    if(user){
      fetchAttendanceHistory(user);
    }
    
    const updateTimeChecks = () => {
       const now = new Date();
      // Check schedule
      if (scheduleSettings) {
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Clock In Window
        if (scheduleSettings.clockInTime) {
            const fourHoursInMinutes = 4 * 60;
            const [inHours, inMinutes] = scheduleSettings.clockInTime.split(':').map(Number);
            const clockInStartTime = inHours * 60 + inMinutes;
            const clockInEndTime = clockInStartTime + fourHoursInMinutes;
            setIsClockInAllowed(currentTimeInMinutes >= clockInStartTime && currentTimeInMinutes <= clockInEndTime);
        } else {
            setIsClockInAllowed(true); // Default to allowed if not set
        }
        
        // Clock Out Window - Allow anytime after the start time
        if (scheduleSettings.clockOutTime) {
            const [outHours, outMinutes] = scheduleSettings.clockOutTime.split(':').map(Number);
            const clockOutStartTime = outHours * 60 + outMinutes;
             setIsClockOutAllowed(currentTimeInMinutes >= clockOutStartTime);
        } else {
             // If clock out time is not set, allow clocking out if they are clocked in
            setIsClockOutAllowed(status === 'in');
        }

      }
    };
    
    updateTimeChecks();
    const timerId = setInterval(updateTimeChecks, 1000);

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

    return () => {
      clearInterval(timerId);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast, user, fetchAttendanceHistory, scheduleSettings, status]);

  useEffect(() => {
    if (selectedCamera && hasCameraPermission && videoRef.current) {
        let stream: MediaStream;
        const startStream = async () => {
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
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [selectedCamera, hasCameraPermission]);


  const getLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini.'));
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocating(false);
          reject(new Error(`Gagal mendapatkan lokasi: ${error.message}`));
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const recordAttendance = async (clockStatus: 'Clocked In' | 'Clocked Out') => {
    if (!user || !user.faceprint) {
       toast({ title: 'Profil Belum Lengkap', description: 'Wajah Anda belum terdaftar. Silakan lengkapi profil Anda.', variant: 'destructive'});
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

    setIsProcessing(true);

    try {
      // 1. Capture image from video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const captureToVerify = canvas.toDataURL('image/jpeg', 0.9);
      
      toast({ title: 'Memverifikasi Wajah...', description: 'Mohon tunggu, AI sedang memproses gambar Anda.' });

      // 2. Verify face with AI
      const verificationResult = await verifyFaces({
        registeredFace: user.faceprint,
        captureToVerify: captureToVerify,
      });

      if (!verificationResult.match) {
        throw new Error('Verifikasi wajah gagal. Pastikan wajah Anda terlihat jelas dan coba lagi.');
      }
      
       toast({ title: 'Wajah Terverifikasi!', description: 'Sekarang memeriksa lokasi Anda.' });

      // 3. Get location settings (user-specific or global fallback)
      let locationSettings: LocationSettings | null = user.locationSettings || null;
      
      if (!locationSettings) {
        const settingsRef = doc(db, 'settings', 'location');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            locationSettings = settingsSnap.data() as LocationSettings;
        } else {
             // If there's no global setting either, we allow attendance from anywhere
             // This can be changed to a strict denial if required
             toast({ title: 'Peringatan', description: 'Pengaturan lokasi global tidak ditemukan. Absen dicatat tanpa validasi lokasi.', variant: 'default' });
        }
      }
      
      // 4. Get user's current location & check distance if settings exist
      const currentLocation = await getLocation();
      setLocation(currentLocation);

      if(locationSettings) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            locationSettings.latitude,
            locationSettings.longitude
          );

          if (distance > locationSettings.radius) {
            throw new Error(`Anda berada ${distance.toFixed(0)} meter dari lokasi yang diizinkan. Anda harus berada dalam radius ${locationSettings.radius} meter untuk absen.`);
          }
      }
      
      const now = new Date();
      // 5. Add record to 'attendance' collection
      await addDoc(collection(db, 'attendance'), {
        employeeId: user.uid,
        employeeName: user.name,
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        status: clockStatus,
        location: currentLocation,
        createdAt: Timestamp.fromDate(now),
      });

      // 6. Update user's last location
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastLocation: currentLocation });
      await checkUserStatus();
      
      setStatus(clockStatus === 'Clocked In' ? 'in' : 'out');
      toast({
        title: `Absen ${clockStatus === 'Clocked In' ? 'Masuk' : 'Keluar'} Berhasil`,
        description: `Kehadiran Anda di [${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}] telah dicatat.`,
      });

      // 7. Refresh history
      await fetchAttendanceHistory(user);

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

  return (
    <div className="container mx-auto max-w-4xl p-0 md:p-0 lg:p-0 space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className='flex-row items-center justify-between'>
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Camera className="text-primary" />
              Otentikasi Wajah
            </CardTitle>
            <CardDescription>Posisikan wajah Anda di dalam bingkai untuk absen masuk atau keluar. Lokasi Anda akan direkam.</CardDescription>
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
                    Berikut adalah seluruh catatan absensi Anda yang tersimpan di sistem.
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
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center relative">
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
              <div className="w-full space-y-2">
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

          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <Button onClick={() => recordAttendance('Clocked In')} size="lg" className="flex-1" disabled={status === 'in' || isProcessing || !hasCameraPermission || !isClockInAllowed}>
              {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <UserCheck className="mr-2" />}
              Absen Masuk
            </Button>
            <Button onClick={() => recordAttendance('Clocked Out')} size="lg" className="flex-1" variant="secondary" disabled={status !== 'in' || isProcessing || !hasCameraPermission || !isClockOutAllowed}>
                {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <UserX className="mr-2" />}
              Absen Keluar
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
