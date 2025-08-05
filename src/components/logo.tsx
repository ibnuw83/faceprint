'use client';

import { Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = () => {
      const storedLogo = localStorage.getItem('app-logo');
      setLogoSrc(storedLogo);
    };

    loadLogo();

    // Listen for changes from the settings page
    window.addEventListener('storage', loadLogo);
    return () => {
      window.removeEventListener('storage', loadLogo);
    };
  }, []);


  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-2 group', className)}
    >
      <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center h-10 w-10">
        {logoSrc ? (
            <Image src={logoSrc} alt="App Logo" width={24} height={24} className="h-6 w-6 object-contain" />
        ) : (
            <Camera className="h-6 w-6" />
        )}
      </div>
      <h1 className="text-xl font-bold text-foreground hidden sm:inline-block">
        VisageID
      </h1>
    </Link>
  );
}
