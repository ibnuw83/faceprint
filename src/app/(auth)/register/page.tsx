
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirebaseError } from 'firebase/app';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appName, setAppName] = useState('VisageID');

  useEffect(() => {
    const fetchBranding = async () => {
        const brandingRef = doc(db, 'settings', 'branding');
        const brandingSnap = await getDoc(brandingRef);
        if (brandingSnap.exists()) {
            const name = brandingSnap.data().appName || 'VisageID';
            setAppName(name);
            document.title = `Register | ${name}`;
        } else {
             document.title = 'Register | VisageID';
        }
    }
    fetchBranding();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password, name);
      toast({
        title: 'Pendaftaran Berhasil',
        description: 'Akun Anda telah dibuat. Silakan login untuk melanjutkan.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
         toast({
          title: 'Email Sudah Terdaftar',
          description: 'Email yang Anda masukkan sudah digunakan. Silakan gunakan email lain atau masuk.',
          variant: 'destructive',
        });
      } else {
        toast({
            title: 'Pendaftaran Gagal',
            description: error.message || 'Terjadi kesalahan tak terduga.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <Logo className="justify-center" showTitle={false} />
        <CardTitle className="text-3xl font-bold">Buat Akun untuk {appName}</CardTitle>
        <CardDescription>
          Masukkan detail Anda untuk memulai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi yang kuat"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full !mt-6" size="lg" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daftar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <p>Sudah punya akun? <Link href="/login" className="text-primary hover:underline">Masuk</Link></p>
          <Separator />
          <Link href="/" className="text-muted-foreground hover:text-primary hover:underline">Kembali ke Halaman Utama</Link>
      </CardFooter>
    </Card>
  );
}
