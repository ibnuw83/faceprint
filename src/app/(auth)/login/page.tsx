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
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appName, setAppName] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
        setLoadingSettings(true);
        const brandingRef = doc(db, 'settings', 'branding');
        const brandingSnap = await getDoc(brandingRef);
        const name = brandingSnap.exists() ? brandingSnap.data().appName : 'VisageID';
        setAppName(name || 'VisageID');
        document.title = `Login | ${name || 'VisageID'}`;
        setLoadingSettings(false);
    }
    fetchBranding();

    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Gagal Masuk',
        description: 'Silakan periksa kembali email dan kata sandi Anda.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <Logo className="justify-center" showTitle={false} />
        {loadingSettings ? (
          <Skeleton className="h-9 w-1/2 mx-auto" />
        ) : (
          <CardTitle className="text-3xl font-bold">{appName}</CardTitle>
        )}
        <CardDescription>
          Masuk ke akun Anda. Gunakan email dengan 'admin' untuk akses admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
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
              placeholder="Masukkan kata sandi apa saja"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full !mt-6" size="lg" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
          </Button>
        </form>
      </CardContent>
       <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <p>Belum punya akun? <Link href="/register" className="text-primary hover:underline">Daftar</Link></p>
          <Separator />
          <Link href="/" className="text-muted-foreground hover:text-primary hover:underline">Kembali ke Halaman Utama</Link>
      </CardFooter>
    </Card>
  );
}
