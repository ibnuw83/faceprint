
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, MapPin, Wifi, WifiOff } from 'lucide-react';
import { calculateDistance } from '@/lib/location';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type LocationSettings = {
    latitude: number;
    longitude: number;
    radius: number;
    name?: string;
    isSpecific: boolean;
} | null;

type Location = {
    latitude: number;
    longitude: number;
};

export default function LocationStatus() {
    const { user, loading: authLoading } = useAuth();
    const [effectiveLocation, setEffectiveLocation] = useState<LocationSettings>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        if (authLoading || !user) return;

        const fetchAllSettings = async () => {
            setLoadingSettings(true);
            try {
                // 1. Check for user-specific settings first
                if (user.locationSettings && user.locationSettings.latitude != null && user.locationSettings.longitude != null) {
                    const globalSettingsDoc = await getDoc(doc(db, 'settings', 'location'));
                    const radius = globalSettingsDoc.exists() ? Number(globalSettingsDoc.data()?.radius) : 50;
                    setEffectiveLocation({
                        ...user.locationSettings,
                        radius: radius,
                        name: user.locationSettings.name || 'Lokasi Khusus Anda',
                        isSpecific: true,
                    });
                    setLoadingSettings(false);
                    return;
                }

                // 2. Fetch department and global settings in parallel
                let departmentSettings: any = null;
                if (user.department) {
                    const q = query(collection(db, 'departments'), where('name', '==', user.department));
                    const deptSnapshot = await getDocs(q);
                    if (!deptSnapshot.empty) {
                        const deptDoc = deptSnapshot.docs[0].data();
                        if (deptDoc.latitude && deptDoc.longitude && deptDoc.radius) {
                            departmentSettings = {
                                latitude: Number(deptDoc.latitude),
                                longitude: Number(deptDoc.longitude),
                                radius: Number(deptDoc.radius),
                                name: deptDoc.name,
                                isSpecific: false
                            };
                        }
                    }
                }

                if(departmentSettings) {
                    setEffectiveLocation(departmentSettings);
                    setLoadingSettings(false);
                    return;
                }

                // 3. Fallback to global settings
                const globalSettingsDoc = await getDoc(doc(db, 'settings', 'location'));
                if (globalSettingsDoc.exists()) {
                    const globalData = globalSettingsDoc.data();
                    if (globalData.latitude && globalData.longitude && globalData.radius) {
                        setEffectiveLocation({
                            latitude: Number(globalData.latitude),
                            longitude: Number(globalData.longitude),
                            radius: Number(globalData.radius),
                            name: globalData.name || 'Lokasi Kantor Pusat',
                            isSpecific: false
                        });
                        setLoadingSettings(false);
                        return;
                    }
                }
                
                // 4. No settings found
                setEffectiveLocation(null);

            } catch(error) {
                console.error("Error loading location settings:", error);
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchAllSettings();

    }, [user, authLoading]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation tidak didukung oleh browser ini.');
            setLoadingLocation(false);
            return;
        }

        const watcher = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationError(null);
                setLoadingLocation(false);
            },
            (err) => {
                setLocationError(`Gagal mendapatkan lokasi: ${err.message}`);
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    const isLoading = loadingSettings || loadingLocation;

    if (isLoading) {
         return (
             <Card className="shadow-md rounded-xl">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        )
    }

    if (!effectiveLocation) {
        return null;
    }

    const distance = currentLocation ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        effectiveLocation.latitude,
        effectiveLocation.longitude
    ) : null;

    const isInRange = distance !== null && distance <= effectiveLocation.radius;
    
    const title = effectiveLocation.name || 'Lokasi Absen';

    const renderContent = () => {
        if (locationError) {
            return <p className='text-sm text-destructive'>{locationError}</p>;
        }
        
        if (currentLocation && distance !== null) {
            return (
                <>
                <div className='flex items-center gap-2'>
                    {isInRange ? <Wifi className="text-green-500"/> : <WifiOff className="text-destructive"/>}
                    <p>
                        Status: <span className={isInRange ? 'font-bold text-green-600' : 'font-bold text-destructive'}>{isInRange ? 'Dalam Jangkauan' : 'Di Luar Jangkauan'}</span>
                        <span className='text-muted-foreground'> | Jarak: {distance.toFixed(0)} meter</span>
                    </p>
                </div>
                 <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-mono text-muted-foreground">
                    <div>
                        <p className='font-bold text-foreground'>Lokasi Anda Saat Ini</p>
                        <p>Lat: {currentLocation.latitude.toFixed(5)}</p>
                        <p>Lng: {currentLocation.longitude.toFixed(5)}</p>
                    </div>
                     <div>
                        <p className='font-bold text-foreground'>Lokasi Wajib Absen</p>
                        <p>Lat: {effectiveLocation.latitude.toFixed(5)}</p>
                        <p>Lng: {effectiveLocation.longitude.toFixed(5)}</p>
                    </div>
                 </div>
                 </>
            )
        }
    };
    

    return (
        <Card className="shadow-md rounded-xl">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full border border-primary/20">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        <CardDescription className="text-xs">
                           Posisi Anda saat ini relatif terhadap lokasi absen yang diwajibkan.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               {renderContent()}
            </CardContent>
        </Card>
    );
}
