'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primaryColor, setPrimaryColor] = useState('#3F51B5');
  const [backgroundColor, setBackgroundColor] = useState('#F5F5F5');
  const [accentColor, setAccentColor] = useState('#009688');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  // Apply theme and logo from localStorage on initial load
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
    
    const loadLogo = () => {
        const storedLogo = localStorage.getItem('app-logo');
        if (storedLogo) {
            setLogoSrc(storedLogo);
        }
    }

    applyTheme();
    loadLogo();
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

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('app-logo', base64String);
        setLogoSrc(base64String);
        toast({ title: 'Logo Diperbarui', description: 'Logo baru telah disimpan.' });
        // Dispatch a storage event to notify other components (like the sidebar logo)
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    localStorage.removeItem('app-logo');
    setLogoSrc(null);
    toast({ title: 'Logo Dihapus', description: 'Logo kustom telah dihapus.' });
    window.dispatchEvent(new Event('storage'));
  }

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
            Pengaturan Tampilan
          </CardTitle>
          <CardDescription>
            Sesuaikan tampilan aplikasi agar sesuai dengan identitas brand Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/svg+xml"
              />
             <div className="flex items-end gap-4">
                 <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center border overflow-hidden">
                  {logoSrc ? (
                    <Image src={logoSrc} alt="Logo Preview" width={96} height={96} className="object-contain" />
                  ) : (
                    <p className="text-muted-foreground text-sm text-center px-2">Logo Saat Ini</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleLogoUploadClick}><Upload className="mr-2"/> Unggah Logo Baru</Button>
                  {logoSrc && (
                    <Button variant="destructive" onClick={removeLogo}><Trash2 className="mr-2"/> Hapus Logo</Button>
                  )}
                </div>
             </div>
              <p className="text-xs text-muted-foreground">Unggah file SVG, PNG, atau JPG. Ukuran yang disarankan: 200x200 piksel.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
