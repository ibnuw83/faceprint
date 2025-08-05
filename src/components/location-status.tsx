
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
} | null;

type Location = {
    latitude: number;
    longitude: number;
};

export default function LocationStatus({ locationSettings }: { locationSettings: LocationSettings }) {
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation tidak didukung oleh browser ini.');
            setLoading(false);
            return;
        }

        const watcher = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setError(null);
                setLoading(false);
            },
            (err) => {
                setError(`Gagal mendapatkan lokasi: ${err.message}`);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    if (!locationSettings) {
        return null; // Don't render if there are no location settings
    }

    const distance = currentLocation ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        locationSettings.latitude,
        locationSettings.longitude
    ) : null;

    const isInRange = distance !== null && distance <= locationSettings.radius;

    const renderContent = () => {
        if (loading) {
            return (
                <>
                 <div className='flex items-center gap-2'>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Mencari lokasi Anda...</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-mono">
                    <div>
                        <p className='font-bold text-foreground'>Lokasi Anda</p>
                        <Skeleton className='h-4 w-3/4 mt-1'/>
                        <Skeleton className='h-4 w-3/4 mt-1'/>
                    </div>
                     <div>
                        <p className='font-bold text-foreground'>Lokasi Wajib</p>
                        <Skeleton className='h-4 w-3/4 mt-1'/>
                        <Skeleton className='h-4 w-3/4 mt-1'/>
                    </div>
                 </div>
                </>
            );
        }

        if (error) {
            return <p className='text-sm text-destructive'>{error}</p>;
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
                        <p>Lat: {locationSettings.latitude.toFixed(5)}</p>
                        <p>Lng: {locationSettings.longitude.toFixed(5)}</p>
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
                        <CardTitle className="text-lg font-semibold">Status Lokasi</CardTitle>
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

