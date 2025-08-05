
'use client';

import { Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type LogoProps = {
  className?: string;
  showTitle?: boolean;
};

export function Logo({ className, showTitle = true }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('VisageID');

  useEffect(() => {
    const loadData = () => {
      const storedLogo = localStorage.getItem('app-logo-url');
      const storedName = localStorage.getItem('app-name');
      setLogoUrl(storedLogo);
      if (storedName) {
          setAppName(storedName);
      }
    };

    loadData();

    // Listen for changes from the settings page
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
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
