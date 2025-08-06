
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Upload, Trash2, Text, Clock, MapPin, RotateCcw, Megaphone, Save, MonitorPlay } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from '@/components/ui/textarea';

// Function to convert HSL string to object
const hslStringToObj = (hslStr: string | null) => {
  if (!hslStr) return { h: 0, s: 0, l: 0 };
  const [h, s, l] = hslStr.split(' ').map(parseFloat);
  return { h, s, l };
};

// Function to convert hex to HSL
const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// Function to convert HSL to hex
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [primaryColor, setPrimaryColor] = useState('#3F51B5');
  const [backgroundColor, setBackgroundColor] = useState('#F5F5F5');
  const [accentColor, setAccentColor] = useState('#009688');
  
  const [logoUrl, setLogoUrl] = useState('');
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const [appName, setAppName] = useState('VisageID');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Location settings
  const [locationName, setLocationName] = useState('');
  const [officeLat, setOfficeLat] = useState('');
  const [officeLng, setOfficeLng] = useState('');
  const [attendanceRadius, setAttendanceRadius] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Schedule settings
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Announcement settings
  const [announcement, setAnnouncement] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Landing page settings
  const [landingDescription, setLandingDescription] = useState('');
  const [landingImageUrls, setLandingImageUrls] = useState('');
  const [isSavingLanding, setIsSavingLanding] = useState(false);


  // Apply theme and settings from localStorage/Firestore on initial load
  useEffect(() => {
    const applyTheme = () => {
      const storedPrimary = localStorage.getItem('theme-primary');
      const storedBackground = localStorage.getItem('theme-background');
      const storedAccent = localStorage.getItem('theme-accent');
      
      if (storedPrimary) {
        const {h,s,l} = hslStringToObj(storedPrimary);
        setPrimaryColor(hslToHex(h,s,l));
        document.documentElement.style.setProperty('--primary', storedPrimary);
      }
      if (storedBackground) {
         const {h,s,l} = hslStringToObj(storedBackground);
         setBackgroundColor(hslToHex(h,s,l));
        document.documentElement.style.setProperty('--background', storedBackground);
      }
      if (storedAccent) {
         const {h,s,l} = hslStringToObj(storedAccent);
         setAccentColor(hslToHex(h,s,l));
        document.documentElement.style.setProperty('--accent', storedAccent);
      }
    };
    
    const loadSettingsFromStorage = () => {
        const storedLogo = localStorage.getItem('app-logo-url');
        if (storedLogo) {
            setLogoUrl(storedLogo);
        }
        const storedName = localStorage.getItem('app-name');
        if (storedName) {
            setAppName(storedName);
            document.title = storedName;
        }
    }

    const fetchSettingsFromDb = async () => {
        const locationRef = doc(db, 'settings', 'location');
        const locationSnap = await getDoc(locationRef);
        if (locationSnap.exists()) {
            const data = locationSnap.data();
            setLocationName(data.name || '');
            setOfficeLat(data.latitude?.toString() || '');
            setOfficeLng(data.longitude?.toString() || '');
            setAttendanceRadius(data.radius?.toString() || '');
        }

        const scheduleRef = doc(db, 'settings', 'schedule');
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
            const data = scheduleSnap.data();
            setClockInTime(data.clockInTime || '');
            setClockOutTime(data.clockOutTime || '');
        }

        const announcementRef = doc(db, 'settings', 'announcement');
        const announcementSnap = await getDoc(announcementRef);
        if (announcementSnap.exists()) {
            setAnnouncement(announcementSnap.data().text || '');
        }

        const landingPageRef = doc(db, 'settings', 'landingPage');
        const landingPageSnap = await getDoc(landingPageRef);
        if (landingPageSnap.exists()) {
            const data = landingPageSnap.data();
            setLandingDescription(data.description || '');
            setLandingImageUrls((data.imageUrls || []).join('\n'));
        }
    }

    applyTheme();
    loadSettingsFromStorage();
    fetchSettingsFromDb();
  }, []);

  const handleColorChange = (colorType: 'primary' | 'background' | 'accent', value: string) => {
    const { h, s, l } = hexToHsl(value);
    const hslString = `${h} ${s}% ${l}%`;

    document.documentElement.style.setProperty(`--${colorType}`, hslString);
    localStorage.setItem(`theme-${colorType}`, hslString);

    if (colorType === 'primary') setPrimaryColor(value);
    if (colorType === 'background') setBackgroundColor(value);
    if (colorType === 'accent') setAccentColor(value);
  };
  
  const resetColors = () => {
    const defaultPrimary = { h: 231, s: 48, l: 48 };
    const defaultBackground = { h: 0, s: 0, l: 96.1 };
    const defaultAccent = { h: 174, s: 100, l: 29 };
    
    handleColorChange('primary', hslToHex(defaultPrimary.h, defaultPrimary.s, defaultPrimary.l));
    handleColorChange('background', hslToHex(defaultBackground.h, defaultBackground.s, defaultBackground.l));
    handleColorChange('accent', hslToHex(defaultAccent.h, defaultAccent.s, defaultAccent.l));
    
    localStorage.removeItem('theme-primary');
    localStorage.removeItem('theme-background');
    localStorage.removeItem('theme-accent');
    
    document.documentElement.style.setProperty('--primary', `${defaultPrimary.h} ${defaultPrimary.s}% ${defaultPrimary.l}%`);
    document.documentElement.style.setProperty('--background', `${defaultBackground.h} ${defaultBackground.s}% ${defaultBackground.l}%`);
    document.documentElement.style.setProperty('--accent', `${defaultAccent.h} ${defaultAccent.s}% ${defaultAccent.l}%`);

    toast({ title: 'Tema Direset', description: 'Warna telah dikembalikan ke pengaturan awal.' });
  }

  const saveLogo = () => {
    setIsSavingLogo(true);
    localStorage.setItem('app-logo-url', logoUrl);
    window.dispatchEvent(new Event('storage'));
     setTimeout(() => {
        toast({ title: 'Logo Disimpan', description: 'URL logo telah diperbarui.' });
        setIsSavingLogo(false);
    }, 500)
  };
  
  const removeLogo = () => {
    localStorage.removeItem('app-logo-url');
    setLogoUrl('');
    window.dispatchEvent(new Event('storage'));
    toast({ title: 'Logo Dihapus', description: 'Logo kustom telah dihapus.' });
  }

  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppName(e.target.value);
  };

  const saveAppName = () => {
    setIsSavingName(true);
    localStorage.setItem('app-name', appName);
    document.title = appName;
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => {
        toast({ title: 'Nama Aplikasi Disimpan', description: `Nama aplikasi telah diubah menjadi "${appName}".` });
        setIsSavingName(false);
    }, 500)
  };
  
  const saveLocationSettings = async () => {
    setIsSavingLocation(true);
    try {
      const latStr = officeLat.trim().replace(',', '.');
      const lngStr = officeLng.trim().replace(',', '.');
      const radiusStr = attendanceRadius.trim();

      const allFieldsEmpty = !latStr && !lngStr && !radiusStr && !locationName.trim();
      const coordFieldsFilled = latStr && lngStr && radiusStr;

      if (!allFieldsEmpty && !coordFieldsFilled) {
        toast({ title: 'Input Koordinat Tidak Lengkap', description: 'Harap isi semua field koordinat (Latitude, Longitude, Radius) atau kosongkan semuanya.', variant: 'destructive'});
        setIsSavingLocation(false);
        return;
      }

      let updateData = {};

      if (coordFieldsFilled) {
        const lat = Number(latStr);
        const lng = Number(lngStr);
        const rad = Number(radiusStr);
        if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
            toast({ title: 'Input Koordinat Tidak Valid', description: 'Pastikan Latitude, Longitude, dan Radius adalah angka.', variant: 'destructive' });
            setIsSavingLocation(false);
            return;
        }
        updateData = { 
            name: locationName.trim() || null,
            latitude: lat,
            longitude: lng,
            radius: rad 
        };
      } else { 
        updateData = { name: null, latitude: null, longitude: null, radius: null };
      }

      const settingsRef = doc(db, 'settings', 'location');
      await setDoc(settingsRef, updateData, { merge: true });
      toast({ title: 'Pengaturan Lokasi Disimpan', description: 'Pengaturan lokasi absensi telah berhasil diperbarui.'});

    } catch (error) {
        console.error('Error saving location settings:', error);
        toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan pengaturan lokasi.', variant: 'destructive'});
    } finally {
        setIsSavingLocation(false);
    }
  }

  const saveScheduleSettings = async () => {
    if (!clockInTime || !clockOutTime) {
        toast({ title: 'Waktu Tidak Lengkap', description: 'Harap isi kedua waktu absensi.', variant: 'destructive' });
        return;
    }
    setIsSavingSchedule(true);
    try {
        const settingsRef = doc(db, 'settings', 'schedule');
        await setDoc(settingsRef, {
            clockInTime: clockInTime,
            clockOutTime: clockOutTime,
        });
        toast({ title: 'Jadwal Disimpan', description: 'Jadwal absensi telah berhasil diperbarui.'});
    } catch (error) {
         console.error('Error saving schedule settings:', error);
        toast({ title: 'Gagal Menyimpan Jadwal', description: 'Terjadi kesalahan saat menyimpan jadwal.', variant: 'destructive'});
    } finally {
        setIsSavingSchedule(false);
    }
  }

  const saveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
        const announcementRef = doc(db, 'settings', 'announcement');
        await setDoc(announcementRef, { text: announcement });
        toast({ title: 'Pengumuman Disimpan', description: 'Teks berjalan telah diperbarui untuk semua karyawan.'});
    } catch (error) {
        console.error('Error saving announcement:', error);
        toast({ title: 'Gagal Menyimpan', variant: 'destructive'});
    } finally {
        setIsSavingAnnouncement(false);
    }
  };

  const handleResetSchedule = async () => {
    setIsSavingSchedule(true);
    try {
        setClockInTime('');
        setClockOutTime('');
        const settingsRef = doc(db, 'settings', 'schedule');
        // Setting the fields to empty strings or null to clear them
        await setDoc(settingsRef, {
            clockInTime: '',
            clockOutTime: '',
        });
        toast({ title: 'Jadwal Direset', description: 'Pengaturan jadwal absensi telah dihapus.'});
    } catch (error) {
        console.error('Error resetting schedule:', error);
        toast({ title: 'Gagal Mereset Jadwal', description: 'Terjadi kesalahan saat mereset jadwal.', variant: 'destructive' });
    } finally {
        setIsSavingSchedule(false);
    }
  };
  
  const saveLandingPageSettings = async () => {
    setIsSavingLanding(true);
    try {
      const urls = landingImageUrls.split('\n').map(url => url.trim()).filter(url => url);
      const settingsRef = doc(db, 'settings', 'landingPage');
      await setDoc(settingsRef, {
        description: landingDescription,
        imageUrls: urls,
      });
      toast({ title: 'Pengaturan Halaman Utama Disimpan', description: 'Konten halaman utama telah diperbarui.' });
    } catch (error) {
      console.error('Error saving landing page settings:', error);
      toast({ title: 'Gagal Menyimpan', variant: 'destructive' });
    } finally {
      setIsSavingLanding(false);
    }
  };


  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Palette className="text-primary" />
            Pengaturan Tampilan & Fungsionalitas
          </CardTitle>
          <CardDescription>
            Sesuaikan tampilan dan fungsionalitas aplikasi agar sesuai dengan kebutuhan organisasi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg flex items-center gap-2"><Text/> Nama Aplikasi</h3>
                <div className="space-y-2">
                    <Label htmlFor="appName">Judul Aplikasi</Label>
                    <div className='flex items-center gap-2'>
                        <Input
                            id="appName"
                            value={appName}
                            onChange={handleAppNameChange}
                            placeholder="e.g. VisageID"
                        />
                         <Button onClick={saveAppName} disabled={isSavingName}>
                            {isSavingName ? <Loader2 className="mr-2 animate-spin"/> : null}
                            Simpan
                         </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Judul ini akan ditampilkan di sidebar, halaman login, dan judul tab browser.</p>
                </div>
            </div>

             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg flex items-center gap-2"><MonitorPlay /> Pengaturan Halaman Utama</h3>
                <div className="space-y-2">
                    <Label htmlFor="landingDescription">Deskripsi Halaman Utama</Label>
                    <Textarea
                        id="landingDescription"
                        placeholder="Jelaskan aplikasi Anda kepada pengunjung..."
                        value={landingDescription}
                        onChange={(e) => setLandingDescription(e.target.value)}
                        disabled={isSavingLanding}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="landingImageUrls">URL Gambar Slideshow (satu per baris)</Label>
                    <Textarea
                        id="landingImageUrls"
                        placeholder="https://example.com/image1.png&#10;https://example.com/image2.png"
                        value={landingImageUrls}
                        onChange={(e) => setLandingImageUrls(e.target.value)}
                        disabled={isSavingLanding}
                        rows={4}
                    />
                </div>
                <Button onClick={saveLandingPageSettings} disabled={isSavingLanding}>
                    {isSavingLanding ? <Loader2 className="mr-2 animate-spin" /> : <Save />}
                    Simpan Pengaturan Halaman Utama
                </Button>
            </div>


            <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg flex items-center gap-2"><Megaphone /> Pengumuman Berjalan</h3>
                <div className="space-y-2">
                    <Label htmlFor="announcementText">Teks Pengumuman</Label>
                    <div className='flex items-center gap-2'>
                       <Textarea
                        id="announcementText"
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Tulis pengumuman singkat di sini..."
                        disabled={isSavingAnnouncement}
                        />
                         <Button onClick={saveAnnouncement} disabled={isSavingAnnouncement}>
                            {isSavingAnnouncement ? <Loader2 className="mr-2 animate-spin"/> : null}
                            Simpan
                         </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Teks ini akan ditampilkan sebagai pengumuman berjalan di dasbor setiap karyawan.</p>
                </div>
            </div>

          <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg">Skema Warna</h3>
             <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="primaryColor">Warna Primer</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="primaryColor" 
                            type="color" 
                            value={primaryColor}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="p-1 h-10 w-14"
                        />
                        <Input 
                           value={primaryColor}
                           onChange={(e) => handleColorChange('primary', e.target.value)}
                           className="font-mono"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Warna utama untuk tombol, ikon, dan sorotan.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Warna Latar</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            id="backgroundColor" 
                            type="color" 
                            value={backgroundColor}
                            onChange={(e) => handleColorChange('background', e.target.value)}
                            className="p-1 h-10 w-14"
                        />
                         <Input 
                           value={backgroundColor}
                           onChange={(e) => handleColorChange('background', e.target.value)}
                           className="font-mono"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Warna latar belakang utama aplikasi.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="accentColor">Warna Aksen</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            id="accentColor" 
                            type="color" 
                            value={accentColor}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="p-1 h-10 w-14"
                        />
                         <Input 
                           value={accentColor}
                           onChange={(e) => handleColorChange('accent', e.target.value)}
                           className="font-mono"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Warna sekunder untuk status atau notifikasi.</p>
                </div>
             </div>
             <div className="pt-4">
                 <Button onClick={resetColors} variant="outline">Reset Warna</Button>
             </div>
          </div>
          <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg">Logo Aplikasi</h3>
              <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center border overflow-hidden shrink-0">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo Preview" width={96} height={96} className="object-contain" unoptimized />
                    ) : (
                      <p className="text-muted-foreground text-sm text-center px-2">Logo Saat Ini</p>
                    )}
                  </div>
                  <div className='w-full space-y-2'>
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        disabled={isSavingLogo}
                    />
                     <div className="flex flex-wrap gap-2">
                      <Button onClick={saveLogo} disabled={isSavingLogo || !logoUrl}>
                        {isSavingLogo ? <Loader2 className="mr-2 animate-spin"/> : <Save />}
                        Simpan Logo
                      </Button>
                      {logoUrl && (
                        <Button variant="destructive" onClick={removeLogo} disabled={isSavingLogo}>
                            <Trash2/> Hapus Logo
                        </Button>
                      )}
                    </div>
                  </div>
             </div>
              <p className="text-xs text-muted-foreground">Masukkan URL gambar (SVG, PNG, JPG). Pastikan domain gambar diizinkan di next.config.ts.</p>
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg flex items-center gap-2"><MapPin/> Pengaturan Lokasi Absensi</h3>
             <p className="text-sm text-muted-foreground">Tentukan lokasi kantor dan radius yang diizinkan untuk absensi. Karyawan harus berada dalam radius ini untuk bisa absen.</p>
                 <div className="space-y-2">
                    <Label htmlFor="locationName">Nama Lokasi</Label>
                    <Input id="locationName" type="text" placeholder="Kantor Pusat Jakarta" value={locationName} onChange={(e) => setLocationName(e.target.value)} disabled={isSavingLocation}/>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="officeLat">Latitude Kantor</Label>
                        <Input id="officeLat" type="text" placeholder="-6.200000" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} disabled={isSavingLocation}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="officeLng">Longitude Kantor</Label>
                        <Input id="officeLng" type="text" placeholder="106.816666" value={officeLng} onChange={(e) => setOfficeLng(e.target.value)} disabled={isSavingLocation}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="attendanceRadius">Radius (meter)</Label>
                        <Input id="attendanceRadius" type="number" placeholder="500" value={attendanceRadius} onChange={(e) => setAttendanceRadius(e.target.value)} disabled={isSavingLocation}/>
                    </div>
                </div>
                
             <div className="pt-4">
                 <Button onClick={saveLocationSettings} disabled={isSavingLocation}>
                    {isSavingLocation ? <Loader2 className="animate-spin mr-2"/> : null}
                    Simpan Pengaturan Lokasi
                </Button>
             </div>
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
             <h3 className="font-semibold text-lg flex items-center gap-2"><Clock /> Jadwal Absensi</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="clockInTime">Waktu Mulai Absen Masuk</Label>
                        <Input id="clockInTime" type="time" value={clockInTime} onChange={e => setClockInTime(e.target.value)} disabled={isSavingSchedule} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clockOutTime">Waktu Mulai Absen Keluar</Label>
                        <Input id="clockOutTime" type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} disabled={isSavingSchedule} />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Tentukan kapan tombol absen aktif untuk karyawan. Kosongkan untuk menonaktifkan jadwal.
                </p>
             <div className="pt-4 flex gap-2">
                 <Button onClick={saveScheduleSettings} disabled={isSavingSchedule}>
                    {isSavingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Simpan Jadwal
                 </Button>
                  <Button onClick={handleResetSchedule} disabled={isSavingSchedule} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    Reset Jadwal
                 </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
