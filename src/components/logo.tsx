
'use client';

import { Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type LogoProps = {
  className?: string;
  showTitle?: boolean;
};

export function Logo({ className, showTitle = true }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('VisageID');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandingRef = doc(db, 'settings', 'branding');
    
    const unsubscribe = onSnapshot(brandingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLogoUrl(data.logoUrl || null);
        setAppName(data.appName || 'VisageID');
        document.title = data.appName || 'VisageID';
      } else {
        setLogoUrl(null);
        setAppName('VisageID');
         document.title = 'VisageID';
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch branding settings:", error);
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
        {logoUrl ? (
            <Image src={logoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
        ) : (
            <Camera className="h-6 w-6 text-primary" />
        )}
      </div>
      {showTitle && (
          <h1 className="text-xl font-bold text-foreground hidden sm:inline-block">
              {appName}
          </h1>
      )}
    </Link>
  );
}
