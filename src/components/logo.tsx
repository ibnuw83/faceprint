
'use client';

import { Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

type LogoProps = {
  className?: string;
  showTitle?: boolean;
};

export function Logo({ className, showTitle = true }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandingRef = doc(db, 'settings', 'branding');
    
    // Use onSnapshot for real-time updates, but getDoc is also fine for one-time fetch
    const unsubscribe = onSnapshot(brandingRef, (docSnap) => {
        setLoading(true);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setLogoUrl(data.logoUrl || null);
            setAppName(data.appName || 'VisageID');
        } else {
            setLogoUrl(null);
            setAppName('VisageID');
        }
        setLoading(false);
    }, (error) => {
        console.error("Failed to fetch branding settings:", error);
        setLogoUrl(null);
        setAppName('VisageID');
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-2 group', className)}
    >
      <div className="bg-white p-2 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center h-10 w-10">
        {loading ? (
           <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        ) : logoUrl ? (
            <Image src={logoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
        ) : (
            <Camera className="h-6 w-6 text-primary" />
        )}
      </div>
      {showTitle && (
          <div className="hidden sm:inline-block">
            {loading ? (
                <Skeleton className="h-6 w-24" />
            ) : (
                <h1 className="text-xl font-bold text-foreground">
                    {appName}
                </h1>
            )}
          </div>
      )}
    </Link>
  );
}
