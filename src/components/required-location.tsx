
'use client';

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

type LocationSettings = {
    latitude: number;
    longitude: number;
    radius: number;
    name?: string;
    isSpecific: boolean; 
}

export default function RequiredLocation() {
    const { user, loading: authLoading } = useAuth();
    const [effectiveLocation, setEffectiveLocation] = useState<LocationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        setLoading(true);

        const fetchSettings = async () => {
             // Priority 1: User-specific location settings
            if (user?.locationSettings && user.locationSettings.latitude != null && user.locationSettings.longitude != null) {
                const globalLocRef = doc(db, 'settings', 'location');
                const globalLocSnap = await getDoc(globalLocRef);
                const radius = globalLocSnap.exists() ? Number(globalLocSnap.data().radius) : 0;
                
                setEffectiveLocation({
                    ...user.locationSettings,
                    radius: radius,
                    name: user.locationSettings.name,
                    isSpecific: true
                });
                setLoading(false);
                return;
            }

            // Priority 2: Global location settings
            const globalLocRef = doc(db, 'settings', 'location');
            const globalLocSnap = await getDoc(globalLocRef);
            if (globalLocSnap.exists()) {
                const data = globalLocSnap.data();
                if (data.latitude != null && data.longitude != null && data.radius != null) {
                   setEffectiveLocation({
                       latitude: Number(data.latitude),
                       longitude: Number(data.longitude),
                       radius: Number(data.radius),
                       name: data.name,
                       isSpecific: false,
                   });
                } else {
                   setEffectiveLocation(null);
                }
           } else {
               setEffectiveLocation(null);
           }
           setLoading(false);
        };

        fetchSettings();

    }, [user, authLoading]);

    if (loading) {
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

    const title = effectiveLocation.name || (effectiveLocation.isSpecific 
        ? 'Lokasi Absen Khusus' 
        : 'Lokasi Absen Kantor');

    return (
        <Card className="shadow-md rounded-xl border-primary/20 bg-primary/5">
             <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full border border-primary/20">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        <CardDescription className="text-xs">
                           Anda harus berada dalam radius yang ditentukan untuk absen.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1 font-mono text-muted-foreground pl-16">
                 <p><strong>Latitude:</strong> {effectiveLocation.latitude.toFixed(6)}</p>
                 <p><strong>Longitude:</strong> {effectiveLocation.longitude.toFixed(6)}</p>
                 <p><strong>Radius:</strong> {effectiveLocation.radius} meter</p>
            </CardContent>
        </Card>
    );
}
