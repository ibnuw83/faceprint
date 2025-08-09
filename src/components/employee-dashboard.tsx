
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
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateDistance } from '@/lib/location';
import LocationStatus from '@/components/location-status';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnnouncementBanner from './announcement-banner';


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
    name?: string;
    isSpecific: boolean;
} | null;

type Department = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
};


type ScheduleSettings = Record<string, { clockIn: string; clockOut: string }>;


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
  const [lastTodayStatus, setLastTodayStatus] = useState<'Clocked In' | 'Clocked Out' | null>(null);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [effectiveLocationSettings, setEffectiveLocationSettings] = useState<LocationSettings>(null);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  
  const [isClockInAllowed, setIsClockInAllowed] = useState(true);
  const [isClockOutAllowed, setIsClockOutAllowed] = useState(true);
  const isMobile = useIsMobile();

  const fetchAttendanceHistory = useCallback(async (uid: string) => {
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      
      setAttendanceHistory(history);

      // Check the last attendance for today
      if (history.length > 0) {
        const lastRecord = history[0];
        const todayStr = new Date().toLocaleDateString('id-ID');
        if (lastRecord.date === todayStr) {
            setLastTodayStatus(lastRecord.status);
        } else {
            setLastTodayStatus(null);
        }
      } else {
        setLastTodayStatus(null);
      }
      
    } catch (error) {
      console.error("Error fetching attendance history: ", error);
       if ((error as any).code === 'failed-precondition' || (error as any).code === 'permission-denied') {
          console.error('Firestore index or permissions missing.');
          toast({
            title: 'Gagal Memuat Riwayat',
            description: 'Aturan keamanan atau indeks database belum benar. Hubungi admin.',
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
    if (!user) {
        setIsLoadingSettings(false);
        setLoadingHistory(false);
        return;
    }

    const fetchAllSettings = async () => {
        setIsLoadingSettings(true);
        try {
            // 1. Fetch all settings in parallel
            const globalScheduleRef = doc(db, 'settings', 'schedule');
            const globalLocationRef = doc(db, 'settings', 'location');
            const departmentsRef = collection(db, 'departments');

            const [globalScheduleSnap, globalLocationSnap, departmentsSnap] = await Promise.all([
                getDoc(globalScheduleRef),
                getDoc(globalLocationRef),
                getDocs(departmentsRef)
            ]);

            const allDepartments = departmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));

            // Determine effective schedule
            const globalSchedule = globalScheduleSnap.exists() ? globalScheduleSnap.data() as ScheduleSettings : null;
            
            // Priority 1: User-specific schedule
            if (user.schedule && Object.values(user.schedule).some(s => s.clockIn || s.clockOut)) {
                setScheduleSettings(user.schedule);
            } 
            // Priority 2: Global schedule
            else {
                setScheduleSettings(globalSchedule);
            }


            // 2. Determine effective location settings (user > department > global)
            const globalSettings = globalLocationSnap.exists() ? globalLocationSnap.data() : null;
            let finalSettings: LocationSettings = null;

            // Priority 1: User-specific settings
            if (user.locationSettings?.latitude && user.locationSettings?.longitude && user.locationSettings?.radius) {
                 finalSettings = {
                    ...user.locationSettings,
                    radius: Number(user.locationSettings.radius),
                    name: user.locationSettings.name || 'Lokasi Khusus Anda',
                    isSpecific: true,
                };
            }
            // Priority 2: Department settings
            else if (user.department) {
                const userDept = allDepartments.find(d => d.name === user.department);
                if (userDept && userDept.latitude && userDept.longitude && userDept.radius) {
                    finalSettings = {
                        latitude: Number(userDept.latitude),
                        longitude: Number(userDept.longitude),
                        radius: Number(userDept.radius),
                        name: userDept.name,
                        isSpecific: false,
                    };
                }
            }
            
            // Priority 3: Global settings (if no specific settings found yet)
            if (!finalSettings && globalSettings?.latitude && globalSettings?.longitude && globalSettings?.radius) {
                 finalSettings = {
                    latitude: Number(globalSettings.latitude),
                    longitude: Number(globalSettings.longitude),
                    radius: Number(globalSettings.radius),
                    name: globalSettings.name || 'Lokasi Kantor Pusat',
                    isSpecific: false,
                };
            }
            
            setEffectiveLocationSettings(finalSettings);


            // 3. Fetch attendance history
            if (user.uid) {
                await fetchAttendanceHistory(user.uid);
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
        const dayIndex = (now.getDay() + 6) % 7; // 0: Senin, 1: Selasa, ..., 6: Minggu
        const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
        const todayName = daysOfWeek[dayIndex];

        let clockInEnabled = false;
        let clockOutEnabled = false;

        if (scheduleSettings && scheduleSettings[todayName]) {
            const todaySchedule = scheduleSettings[todayName];
            const CLOCK_IN_WINDOW_MINUTES = 4 * 60; // 4 hours

            // Clock-In Logic
            if (todaySchedule.clockIn) {
                const [inHours, inMinutes] = todaySchedule.clockIn.split(':').map(Number);
                const clockInStartTime = inHours * 60 + inMinutes;
                const clockInEndTime = clockInStartTime + CLOCK_IN_WINDOW_MINUTES;

                // Button is enabled if current time is within the 4-hour window
                if (currentTimeInMinutes >= clockInStartTime && currentTimeInMinutes <= clockInEndTime) {
                    clockInEnabled = true;
                }
            }

            // Clock-Out Logic
            if (todaySchedule.clockOut) {
                const [outHours, outMinutes] = todaySchedule.clockOut.split(':').map(Number);
                const clockOutStartTime = outHours * 60 + outMinutes;
                
                // Button is enabled if current time is at or after the clock-out time
                if (currentTimeInMinutes >= clockOutStartTime) {
                    clockOutEnabled = true;
                }
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
          const frontCamera = videoDevices.find(device => device.label.toLowerCase().includes('front'));
          setSelectedCamera(frontCamera ? frontCamera.deviceId : videoDevices[0].deviceId);
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
      const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      toast({ title: 'Memvalidasi Lokasi...', description: 'Mohon tunggu sebentar.', variant: 'default' });
      
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
      }
      
      const now = new Date();
      
      await addDoc(collection(db, 'attendance'), {
        employeeId: user.employeeId,
        employeeName: user.name,
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID'),
        status: clockStatus,
        photoUrl: photoUrl,
        location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
        },
        createdAt: Timestamp.fromDate(now),
        uid: user.uid,
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastLocation: currentLocation });
      await checkUserStatus();
      
      toast({
        title: `Absen ${clockStatus === 'Clocked In' ? 'Masuk' : 'Keluar'} Berhasil`,
        description: `Kehadiran Anda telah dicatat pada pukul ${now.toLocaleTimeString('id-ID')}.`,
      });

      if (user.uid) {
        await fetchAttendanceHistory(user.uid);
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
  
  const baseButtonsDisabled = isProcessing || !hasCameraPermission || isLoadingSettings;
  const clockInDisabled = baseButtonsDisabled || !isClockInAllowed || lastTodayStatus === 'Clocked In';
  const clockOutDisabled = baseButtonsDisabled || !isClockOutAllowed || lastTodayStatus !== 'Clocked In';

  return (
    <div className="flex flex-col w-full space-y-6">
       <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dasbor Karyawan</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali, {user?.name}. Silakan catat kehadiran Anda di sini.
        </p>
         <AnnouncementBanner />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Camera className="text-primary"/>
                Absen dengan Wajah
            </CardTitle>
            <CardDescription>
                Posisikan wajah Anda di depan kamera dan tekan tombol yang sesuai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                 <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                 <canvas ref={canvasRef} className="hidden"></canvas>
                  {hasCameraPermission === false && (
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
                  {hasCameraPermission === null && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-white">
                        <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                        Meminta izin kamera...
                    </div>
                  )}
              </div>
              {cameras.length > 1 && hasCameraPermission && !isMobile && (
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
              <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => recordAttendance('Clocked In')} size="lg" className="flex-1" disabled={clockInDisabled}>
                    {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <UserCheck className="mr-2" />}
                    Absen Masuk
                  </Button>
                  <Button onClick={() => recordAttendance('Clocked Out')} size="lg" className="flex-1" variant="outline" disabled={clockOutDisabled}>
                    {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <UserX className="mr-2" />}
                    Absen Keluar
                  </Button>
              </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
            <LocationStatus effectiveLocation={effectiveLocationSettings} loading={isLoadingSettings} />
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <History />
                        Riwayat Absensi Terbaru
                    </CardTitle>
                    <CardDescription>
                        10 catatan absensi terakhir Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
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
        </div>
      </div>
    </div>
  );
}
