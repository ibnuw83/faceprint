
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:p-6">
        <Logo />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="grid md:grid-cols-2 items-center gap-12 max-w-6xl mx-auto">
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Selamat Datang di Portal Karyawan
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                    Sistem absensi modern berbasis pengenalan wajah. Masuk untuk mencatat kehadiran Anda atau lihat riwayat absensi Anda.
                </p>
                <div className="flex gap-4">
                    <Button asChild size="lg">
                        <Link href="/login">Masuk</Link>
                    </Button>
                     <Button asChild size="lg" variant="outline">
                        <Link href="/register">Daftar</Link>
                    </Button>
                </div>
            </div>
             <div className="relative w-full max-w-md aspect-square">
                <Image 
                    src="https://placehold.co/600x600.png" 
                    alt="Ilustrasi sistem absensi" 
                    layout="fill"
                    objectFit="cover"
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="office employee biometric"
                />
            </div>
        </div>
      </main>
       <footer className="p-4 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} VisageID. All rights reserved.
        </footer>
    </div>
  );
}
