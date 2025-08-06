
'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Autoplay from "embla-carousel-autoplay"


type LandingPageSettings = {
  title: string;
  description: string;
  imageUrls: string[];
};

export default function HomePage() {
  const [settings, setSettings] = useState<LandingPageSettings>({
    title: 'Selamat Datang di Portal Karyawan',
    description: 'Sistem absensi modern berbasis pengenalan wajah. Masuk untuk mencatat kehadiran Anda atau lihat riwayat absensi Anda.',
    imageUrls: ['https://placehold.co/600x600.png'],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'landingPage');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure imageUrls is always an array
          const urls = Array.isArray(data.imageUrls) && data.imageUrls.length > 0 ? data.imageUrls : ['https://placehold.co/600x600.png'];
          setSettings({
            title: data.title || 'Selamat Datang di Portal Karyawan',
            description: data.description || 'Sistem absensi modern berbasis pengenalan wajah. Masuk untuk mencatat kehadiran Anda atau lihat riwayat absensi Anda.',
            imageUrls: urls,
          });
        }
      } catch (error) {
        console.error("Error fetching landing page settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="grid md:grid-cols-2 items-center gap-12 max-w-6xl mx-auto">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
             {loading ? (
                <Skeleton className="h-12 w-3/4" />
             ) : (
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {settings.title}
                </h1>
             )}
            {loading ? (
              <div className='space-y-2 w-full'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            ) : (
               <p className="text-lg text-muted-foreground max-w-md">
                {settings.description}
               </p>
            )}
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          </div>
          <div className="w-full max-w-md mx-auto">
             {loading ? (
                <Skeleton className="w-full aspect-square rounded-xl" />
             ) : (
               <Carousel 
                  className="w-full" 
                  opts={{ loop: true }}
                  plugins={[plugin.current]}
                  onMouseEnter={plugin.current.stop}
                  onMouseLeave={plugin.current.reset}
                >
                  <CarouselContent>
                    {settings.imageUrls.map((url, index) => (
                      <CarouselItem key={index}>
                        <Card className="overflow-hidden rounded-xl shadow-2xl">
                           <CardContent className="flex aspect-square items-center justify-center p-0">
                             <Image 
                                src={url} 
                                alt={`Ilustrasi sistem absensi ${index + 1}`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-500 hover:scale-105"
                                data-ai-hint="office employee biometric"
                                unoptimized
                              />
                           </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex"/>
                </Carousel>
             )}
          </div>
        </div>
      </main>
      <footer className="p-4 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} VisageID. All rights reserved.
      </footer>
    </div>
  );
}
