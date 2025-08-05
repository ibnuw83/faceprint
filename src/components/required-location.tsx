
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
}

export default function RequiredLocation() {
    const { user } = useAuth();
    const [location, setLocation] = useState<LocationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If user has specific settings, don't show the global one.
        if (user?.locationSettings) {
            setLoading(false);
            setLocation(null);
            return;
        }

        const docRef = doc(db, 'settings', 'location');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.latitude != null && data.longitude != null && data.radius != null) {
                    setLocation({
                        latitude: Number(data.latitude),
                        longitude: Number(data.longitude),
                        radius: Number(data.radius),
                    });
                 } else {
                    setLocation(null);
                 }
            } else {
                setLocation(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching location settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
             <Card>
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

    if (!location) {
        return null; // Don't render anything if no global location is set or if user has specific settings
    }

    return (
        <Card className="shadow-md rounded-xl border-primary/20 bg-primary/5">
             <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full border border-primary/20">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">Lokasi Absen Wajib (Global)</CardTitle>
                        <CardDescription className="text-xs">
                           Anda harus berada dalam radius yang ditentukan untuk absen.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1 font-mono text-muted-foreground pl-16">
                 <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                 <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                 <p><strong>Radius:</strong> {location.radius} meter</p>
            </CardContent>
        </Card>
    );
}
