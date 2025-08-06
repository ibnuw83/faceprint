
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Clock, UserCheck, UserX, MapPin, Loader2, AlertTriangle, History, Smile, Mail, Tv, Shield, HandCoins, Users, Siren, Newspaper } from 'lucide-react';
import { useAuth, User } from '@/hooks/use-auth';
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, limit, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AnnouncementBanner from './announcement-banner';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import Link from 'next/link';

const ServiceMenu = () => {

    const mainServices = [
        {name: "MyPresence", icon: Smile, href: "/mypresence"},
        {name: "MyLetter", icon: Mail, href: "#"},
    ]

    const otherServices = [
        {name: "SIPBB", icon: Tv, href: "#"},
        {name: "Survei Kepuasan", icon: Smile, href: "#"},
        {name: "PPID", icon: Shield, href: "#"},
        {name: "Desa Online", icon: Users, href: "#"},
        {name: "ASN Digital", icon: UserCheck, href: "#"},
        {name: "Geopark", icon: MapPin, href: "#"},
        {name: "Marketplace", icon: HandCoins, href: "#"},
        {name: "CCTV", icon: Camera, href: "#"},
    ]

    return (
        <div className="bg-background rounded-t-3xl -mt-8 p-4 z-10 relative">
             <Card className="shadow-lg -mt-16 mx-4">
                <CardContent className="p-4">
                    <div className="flex justify-around">
                        {mainServices.map(service => (
                             <Link href={service.href} key={service.name} className="flex flex-col items-center gap-2 text-center w-24">
                                <div className="bg-primary/10 p-4 rounded-xl">
                                    <service.icon className="h-8 w-8 text-primary"/>
                                </div>
                                <p className="text-sm font-medium">{service.name}</p>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-4 gap-4 mt-6 text-center">
                {otherServices.map(service => (
                     <Link href={service.href} key={service.name} className="flex flex-col items-center gap-2">
                        <div className="bg-muted p-3 rounded-xl">
                           <service.icon className="h-6 w-6 text-muted-foreground"/>
                        </div>
                        <p className="text-xs text-muted-foreground">{service.name}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

const NewsSection = () => {
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Berita Utama</h2>
                <Button variant="link" asChild>
                    <Link href="#">Lihat Semua</Link>
                </Button>
            </div>
            <Card className="overflow-hidden relative">
                <Image src="https://placehold.co/600x400.png" alt="News" width={600} height={400} className="w-full h-auto" data-ai-hint="government meeting"/>
                 <div className="absolute top-2 right-2">
                    <Button size="icon" variant="destructive" className="rounded-full h-12 w-12 shadow-lg">
                        <Siren className="h-6 w-6" />
                    </Button>
                </div>
                <div className="p-4 bg-background">
                    <CardTitle className="text-base">Verifikasi Lanjutan Penilaian Kabupaten Kota Sehat Tahun 2025</CardTitle>
                    <CardDescription className="text-xs mt-2">Dinas Kesehatan, Pengendalian Penduduk dan Keluarga Berencana Kabupaten Kebumen</CardDescription>
                </div>
            </Card>
        </div>
    )
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col w-full bg-muted">
        <div className="relative h-64">
             <Carousel>
                <CarouselContent>
                    <CarouselItem>
                        <Image src="https://placehold.co/600x400.png" alt="Header image" layout="fill" objectFit="cover" data-ai-hint="cave waterfall" />
                    </CarouselItem>
                    <CarouselItem>
                         <Image src="https://placehold.co/600x400.png" alt="Header image 2" layout="fill" objectFit="cover" data-ai-hint="beach landscape" />
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>

       <ServiceMenu />
       <NewsSection />
    </div>
  );
}

