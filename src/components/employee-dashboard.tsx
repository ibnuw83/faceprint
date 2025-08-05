
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Clock, UserCheck, UserX, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Location = {
  latitude: number;
  longitude: number;
};

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user, checkUserStatus } = useAuth();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'in' | 'out' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    // --- Date and Time Logic ---
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID'));
      setDate(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const timerId = setInterval(updateDateTime, 1000);

    // --- Camera Logic ---
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
          setSelectedCamera(videoDevices[0].deviceId);
        }
        
        // We can stop the initial permission stream, a new one will be started based on selection
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

    return () => {
      clearInterval(timerId);
    };
  }, [toast]);

  useEffect(() => {
    // Effect to start/restart stream when selectedCamera changes
    if (selectedCamera && hasCameraPermission && videoRef.current) {
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
        { enableHighAccuracy: true } // Request more accurate location
      );
    });
  };

  const handleClockIn = async () => {
    if (!user) return;
    if (!hasCameraPermission) {
        toast({ title: 'Kamera Diperlukan', description: 'Akses kamera diperlukan untuk absen.', variant: 'destructive'});
        return;
    }
    setIsProcessing(true);
    try {
      const currentLocation = await getLocation();
      setLocation(currentLocation);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastLocation: currentLocation });
      await checkUserStatus();
      setStatus('in'); // Set status to 'in' after successful clock-in

      toast({
        title: 'Absen Masuk Berhasil',
        description: `Selamat datang, ${user?.name}! Kehadiran Anda di [${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}] telah dicatat.`,
      });
    } catch (error: any) {
      toast({
        title: 'Gagal Absen Masuk',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
     if (!hasCameraPermission) {
        toast({ title: 'Kamera Diperlukan', description: 'Akses kamera diperlukan untuk absen.', variant: 'destructive'});
        return;
    }
    setIsProcessing(true);
    try {
      const currentLocation = await getLocation();
      setLocation(currentLocation);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastLocation: currentLocation });
      await checkUserStatus();
      setStatus('out'); // Set status to 'out' after successful clock-out

      toast({
        title: 'Absen Keluar Berhasil',
        description: `Sampai jumpa, ${user?.name}! Kepergian Anda dari [${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}] telah dicatat.`,
      });
    } catch (error: any)       {
      toast({
        title: 'Gagal Absen Keluar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Camera className="text-primary" />
              Otentikasi Wajah
            </CardTitle>
            <CardDescription>Posisikan wajah Anda di dalam bingkai untuk absen masuk atau keluar. Lokasi Anda akan direkam.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center relative">
               <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
               {!(hasCameraPermission) && (
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
               {hasCameraPermission === null && (
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-white">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    Meminta izin kamera...
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
              <Button onClick={handleClockIn} size="lg" className="flex-1" disabled={status === 'in' || isProcessing || !hasCameraPermission}>
                {(isProcessing && !isLocating) ? <Loader2 className="mr-2 animate-spin" /> : <UserCheck className="mr-2" />}
                Absen Masuk
              </Button>
              <Button onClick={handleClockOut} size="lg" className="flex-1" variant="secondary" disabled={status !== 'in' || isProcessing || !hasCameraPermission}>
                 {(isProcessing && !isLocating) ? <Loader2 className="mr-2 animate-spin" /> : <UserX className="mr-2" />}
                Absen Keluar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock /> Waktu Saat Ini</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-primary">{time || '...'}</p>
              <p className="text-muted-foreground">{date || '...'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
             <CardHeader>
                <CardTitle>Status Kehadiran</CardTitle>
             </CardHeader>
             <CardContent>
                {status === 'in' ? (
                    <div className="flex items-start gap-3 text-green-600 dark:text-green-400">
                        <UserCheck className="h-8 w-8 shrink-0"/>
                        <div>
                            <p className="font-bold text-lg">Sudah Absen Masuk</p>
                            <p className="text-sm text-muted-foreground">Anda saat ini sedang bekerja.</p>
                        </div>
                    </div>
                ) : status === 'out' ? (
                    <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                        <UserX className="h-8 w-8 shrink-0"/>
                        <div>
                            <p className="font-bold text-lg">Sudah Absen Keluar</p>
                            <p className="text-sm text-muted-foreground">Anda telah menyelesaikan shift Anda.</p>
                        </div>
                    </div>
                ) : (
                     <p className="text-muted-foreground">Anda belum absen masuk hari ini.</p>
                )}
             </CardContent>
          </Card>
           <Card className="shadow-lg rounded-xl">
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin /> Lokasi Terakhir</CardTitle>
             </CardHeader>
             <CardContent>
                {isLocating ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span>Mencari lokasi...</span>
                  </div>
                ) : location ? (
                    <div className="text-sm">
                      <p>Lintang: {location.latitude.toFixed(5)}</p>
                      <p>Bujur: {location.longitude.toFixed(5)}</p>
                       <a 
                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Lihat di Google Maps
                        </a>
                    </div>
                ) : (
                     <p className="text-muted-foreground text-sm">Lokasi akan direkam saat Anda absen.</p>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

