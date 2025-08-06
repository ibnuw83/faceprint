
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, MapPin, Wifi, WifiOff } from 'lucide-react';
import { calculateDistance } from '@/lib/location';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

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

type LocationStatusProps = {
    effectiveLocation: LocationSettings;
    loading: boolean;
};

export default function LocationStatus({ effectiveLocation, loading: loadingSettings }: LocationStatusProps) {
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);
    
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
